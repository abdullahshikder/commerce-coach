import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { hashPassword, digest, randomToken } from './auth/password';

test('authentication, organization RBAC, and native PostgreSQL RLS', async t => {
  if (!process.env.TEST_DATABASE_ADMIN_URL) throw new Error('Set TEST_DATABASE_ADMIN_URL. Tests create and remove a separate temporary database and runtime login.');
  const base = new URL(process.env.TEST_DATABASE_ADMIN_URL);
  const database = `coach_test_${randomUUID().replaceAll('-','')}`;
  const runtimeName = database;
  const owner = new Pool({ connectionString: base.toString() });
  await owner.query(`CREATE DATABASE "${database}"`);
  const migration = new URL(base); migration.pathname = `/${database}`;
  const runtime = new URL(migration); runtime.username = runtimeName; runtime.password = randomToken();
  const authConnection = new URL(runtime); authConnection.username = runtimeName + '_auth';
  process.env.AUTH_DATABASE_URL = authConnection.toString();
  process.env.MIGRATION_DATABASE_URL = migration.toString(); process.env.DATABASE_URL = runtime.toString();
  process.env.OPENROUTER_API_KEY=''; process.env.GEMINI_API_KEY=''; process.env.VITE_OPENROUTER_API_KEY='';
  process.env.NODE_ENV='test'; process.env.COOKIE_SECURE='false';
  let cleanup: (() => Promise<void>) | undefined;
  t.after(async () => {
    await cleanup?.();
    await owner.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    await owner.query(`DROP ROLE IF EXISTS "${runtimeName}"`);
    await owner.query(`DROP ROLE IF EXISTS "${runtimeName}_auth"`);
    await owner.end();
  });
  const { migrate } = await import('./migrate');
  await migrate(); await migrate(); // Repeat deployment must preserve data and policies.
  const admin = new Pool({ connectionString: migration.toString() });
  cleanup = () => admin.end();
  const { app } = await import('./app');
  const { pool, authPool, withSession, checkDatabase, closeDb } = await import('./db');
  const password='Correct horse battery staple 2026';
  const hash=await hashPassword(password);
  const orgA=randomUUID(), orgB=randomUUID();
  await admin.query('INSERT INTO coach_private.organizations(id,slug,name) VALUES($1,\'pathao\',\'Pathao\'),($2,\'beta\',\'Beta\')',[orgA,orgB]);
  const ids: Record<string,string>={};
  for(const [name,org,role] of [['admin',orgA,'admin'],['reviewer',orgA,'reviewer'],['member',orgA,'member'],['other',orgA,'member'],['beta',orgB,'admin']]){
    ids[name]=randomUUID();
    await admin.query(`INSERT INTO coach_private.users(id,organization_id,email,name,password_hash,role,must_change_password) VALUES($1,$2,$3,$4,$5,$6,false)`,[ids[name],org,`${name}@example.com`,name,hash,role]);
  }
  const server=app.listen(0,'127.0.0.1');await new Promise<void>(resolve=>server.once('listening',resolve));
  cleanup = async () => { await new Promise<void>(resolve => server.close(() => resolve())); await closeDb(); await admin.end(); };
  const url=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
  type Login={cookie:string;csrf:string;token:string;user:any};
  const request=(path:string,login?:Login,body?:unknown,method=body===undefined?'GET':'POST',extra={})=>fetch(url+path,{method,headers:{'Content-Type':'application/json','X-Coach-Request':'1',...(login?{Cookie:login.cookie,'X-CSRF-Token':login.csrf}:{}),...extra},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const session=async(token:string):Promise<Login>=>{
    const cookie=`coach_session=${token}`;
    const provisional={cookie,csrf:'',token,user:null};
    const me=await (await request('/api/auth/me',provisional)).json();
    return {...provisional,csrf:me.user.csrf_token,user:me.user};
  };
  const signIn=async(name:string,pass=password):Promise<Login>=>{
    const response=await request('/api/auth/login',undefined,{email:`${name}@example.com`,password:pass});
    assert.equal(response.status,200);
    const cookieHeader=response.headers.get('set-cookie')!;assert.match(cookieHeader,/HttpOnly/);assert.match(cookieHeader,/SameSite=Strict/);
    return session(cookieHeader.split(';')[0].split('=')[1]);
  };
  const openTestSession=async(name:string):Promise<Login>=>{
    const token=randomToken();
    await authPool.query('SELECT public.coach_open_session($1,$2,$3,$4)',[ids[name],hash,digest(token),randomToken()]);
    return session(token);
  };
  let member:Login,other:Login,reviewer:Login,alphaAdmin:Login,beta:Login;
  let feedbackId:string, betaFeedbackId:string;
  try {
    await t.test('runtime cannot bypass RLS and private auth tables are inaccessible',async()=>{
      await checkDatabase();
      const flags=(await pool.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='public.coach_feedback'::regclass")).rows[0];
      assert.deepEqual(flags,{relrowsecurity:true,relforcerowsecurity:true});
      await assert.rejects(pool.query('SELECT * FROM coach_private.users'),{code:'42501'});
      await assert.rejects(pool.query('SELECT * FROM coach_private.embedding_previews'),{code:'42501'});
      await assert.rejects(pool.query("SELECT * FROM public.coach_login_lookup('alpha','admin@example.com')"),{code:'42501'});
      await assert.rejects(pool.query("SELECT public.coach_open_session($1,'hash','token','csrf')",[ids.admin]),{code:'42501'});
      await assert.rejects(pool.query('TRUNCATE public.coach_feedback'),{code:'42501'});
      await assert.rejects(pool.query('ALTER TABLE public.coach_feedback DISABLE ROW LEVEL SECURITY'),{code:'42501'});
    });
    await t.test('all application APIs require sign-in; forged headers and shared token do not authenticate',async()=>{
      for(const [path,body] of [['/api/config',undefined],['/api/coach/retrieve',{query:'orders'}],['/api/coach/generate',{}],['/api/coach/feedback',{}],['/api/analytics',undefined],['/api/analytics/training-data',undefined],['/api/users',undefined]] as const){
        assert.equal((await request(path,undefined,body,body === undefined ? 'GET' : 'POST',{'x-user-id':ids.admin,'x-user-role':'admin',Authorization:'Bearer local-browser-test-token'})).status,401);
      }
      assert.equal((await request('/api/auth/login',undefined,{email:'admin@example.com',password:'wrong'})).status,401);
    });
    await t.test('individual sign-in binds role and organization to database sessions',async()=>{
      assert.equal((await request('/api/auth/login',undefined,{organization:'beta',email:'beta@example.com',password})).status,401);
      member=await signIn('member');other=await signIn('other');reviewer=await signIn('reviewer');alphaAdmin=await signIn('admin');beta=await openTestSession('beta');
      assert.equal(member.user.role,'member');assert.equal(member.user.organization_id,orgA);
      assert.equal(beta.user.organization_id,orgB);
      const stored=(await admin.query('SELECT token_hash FROM coach_private.sessions WHERE user_id=$1',[ids.member])).rows[0];
      assert.equal(stored.token_hash,digest(member.token));assert.notEqual(stored.token_hash,member.token);
    });
    await t.test('CSRF protection rejects missing tokens and foreign origins',async()=>{
      assert.equal((await request('/api/coach/feedback',member,{},'POST',{'X-CSRF-Token':''})).status,403);
      assert.equal((await request('/api/auth/login',undefined,{},'POST',{Origin:'https://attacker.example'})).status,403);
      assert.equal((await request('/api/auth/logout',member,{},'POST',{'X-Coach-Request':''})).status,403);
    });
    await t.test('members submit only their own tenant feedback and cannot access reviewer/admin APIs',async()=>{
      for(const path of ['/api/coach/feedback','/api/analytics','/api/analytics/training-data','/api/users'])assert.equal((await request(path,member)).status,403);
      const input={responseId:'same-response',query:'Where are orders?',answer:'Wrong answer',rating:'unhelpful',issueType:'wrong-answer',organization_id:orgB,user_id:ids.beta,role:'admin'};
      const saved=await request('/api/coach/feedback',member,input);assert.equal(saved.status,201);feedbackId=(await saved.json()).feedback.id;
      assert.equal((await request('/api/coach/feedback',other,input)).status,201);
      const b=await request('/api/coach/feedback',beta,input);assert.equal(b.status,201);betaFeedbackId=(await b.json()).feedback.id;
      const row=(await admin.query('SELECT organization_id,user_id FROM public.coach_feedback WHERE id=$1',[feedbackId])).rows[0];
      assert.deepEqual(row,{organization_id:orgA,user_id:ids.member});
      const mine=await (await request('/api/coach/feedback/mine',member)).json();assert.equal(mine.items.length,1);assert.equal(mine.items[0].id,feedbackId);
      assert.equal((await request(`/api/coach/feedback/${feedbackId}`,member,{status:'approved'},'PATCH')).status,403);
    });
    await t.test('database RLS blocks cross-tenant reads/writes and ignores forged identity settings',async()=>{
      assert.equal((await pool.query('SELECT * FROM public.coach_feedback')).rowCount,0);
      const own=await withSession(digest(member.token),client=>client.query('SELECT * FROM public.coach_feedback'));
      assert.equal(own.rowCount,1);assert.equal(own.rows[0].id,feedbackId);
      const cross=await withSession(digest(alphaAdmin.token),client=>client.query('SELECT * FROM public.coach_feedback WHERE id=$1',[betaFeedbackId]));assert.equal(cross.rowCount,0);
      const forged=await withSession('not-a-session',async client=>{await client.query("SELECT set_config('coach.organization_id',$1,true),set_config('coach.role','admin',true)",[orgB]);return client.query('SELECT * FROM public.coach_feedback');});assert.equal(forged.rowCount,0);
      await assert.rejects(withSession(digest(member.token),client=>client.query('UPDATE public.coach_feedback SET organization_id=$1 WHERE id=$2',[orgB,feedbackId])),{code:'42501'});
      await assert.rejects(withSession(digest(member.token),client=>client.query("UPDATE public.coach_feedback SET status='approved',reviewer_id=$1 WHERE id=$2",[ids.member,feedbackId])),{code:'42501'});
      await assert.rejects(withSession(digest(member.token),client=>client.query(`INSERT INTO public.coach_feedback(id,organization_id,user_id,response_id,query,answer,rating,status) VALUES($1,$2,$3,'foreign','q','a','helpful','recorded')`,[randomUUID(),orgB,ids.beta])),{code:'42501'});
      assert.equal((await pool.query('SELECT * FROM public.coach_feedback')).rowCount,0,'session context must not leak across pool reuse');
    });
    await t.test('knowledge is mirrored read-only and query logs remain private to their author',async()=>{
      const knowledge=(await pool.query("SELECT record_type,count(*)::integer AS count FROM public.coach_knowledge WHERE active GROUP BY record_type ORDER BY record_type")).rows;
      assert.deepEqual(knowledge,[{record_type:'merchant-faq',count:113},{record_type:'product-knowledge',count:139}]);
      await assert.rejects(pool.query("UPDATE public.coach_knowledge SET answer='forged' WHERE id='merchant-faq-001'"),{code:'42501'});
      const queryId=randomUUID();
      await withSession(digest(member.token),client=>client.query(`INSERT INTO public.coach_query_logs
        (id,organization_id,user_id,query,answer,provider,mode,retrieval_document_ids,screenshot_ids)
        VALUES($1,$2,$3,'How do I upload products?','Use Bulk Upload.','gemini','normal','["knowledge:bulk-001"]','[]')`,[queryId,orgA,ids.member]));
      const own=await withSession(digest(member.token),client=>client.query('SELECT id,query FROM public.coach_query_logs WHERE id=$1',[queryId]));
      assert.equal(own.rowCount,1);
      for(const login of [other,reviewer,alphaAdmin,beta]){
        await withSession(digest(login.token),async client=>assert.equal((await client.query('SELECT id FROM public.coach_query_logs WHERE id=$1',[queryId])).rowCount,0));
      }
      assert.equal((await pool.query('SELECT id FROM public.coach_query_logs')).rowCount,0);
      await assert.rejects(withSession(digest(member.token),client=>client.query(`INSERT INTO public.coach_query_logs
        (id,organization_id,user_id,query,answer,provider,mode) VALUES($1,$2,$3,'forged','forged','gemini','normal')`,[randomUUID(),orgB,ids.beta])),{code:'42501'});
      await assert.rejects(withSession(digest(member.token),client=>client.query('DELETE FROM public.coach_query_logs WHERE id=$1',[queryId])),{code:'42501'});
    });
    await t.test('admin analytics are aggregate-only, tenant-scoped, and inaccessible to members and reviewers',async()=>{
      await assert.rejects(pool.query('SELECT * FROM coach_private.analytics_queries'),{code:'42501'});
      await withSession(digest(member.token),client=>client.query("SELECT public.coach_record_generation_failure('gemini','provider-request')"));
      await admin.query(`INSERT INTO public.coach_query_logs
        (id,organization_id,user_id,query,answer,provider,mode,retrieval_document_ids,screenshot_ids,created_at)
        VALUES($1,$2,$3,'Previous period query','Previous period answer','openrouter','training','["merchant-faq-001"]','[]',current_date-31)`,[randomUUID(),orgA,ids.member]);
      assert.equal((await request('/api/analytics',member)).status,403);
      assert.equal((await request('/api/analytics',reviewer)).status,403);
      assert.equal((await request('/api/analytics?days=10',alphaAdmin)).status,400);
      await assert.rejects(withSession(digest(member.token),client=>client.query('SELECT public.coach_admin_analytics(30)')),{code:'42501'});
      const alpha=await (await request('/api/analytics?days=30',alphaAdmin)).json();
      assert.equal(alpha.totals.queries,1);assert.equal(alpha.totals.failures,1);
      assert.equal(alpha.totals.groundedQueries,0);assert.equal(alpha.previousTotals.queries,1);assert.equal(alpha.previousTotals.groundedQueries,1);
      assert.equal(alpha.totals.feedback,2);assert.equal(alpha.totals.unhelpful,2);assert.equal(alpha.totals.pendingFeedback,2);
      assert.deepEqual(alpha.providers,[{name:'gemini',count:1}]);
      assert.deepEqual(alpha.topics,[{name:'General',count:1}]);
      const serialized=JSON.stringify(alpha);
      assert.doesNotMatch(serialized,/How do I upload products\?|Use Bulk Upload\.|Wrong answer/);
      const isolated=await (await request('/api/analytics?days=30',beta)).json();
      assert.equal(isolated.totals.queries,0);assert.equal(isolated.totals.failures,0);assert.equal(isolated.totals.feedback,1);
    });
    await t.test('reviewers see their organization only and decisions record the actual reviewer',async()=>{
      const list=await (await request('/api/coach/feedback',reviewer)).json();assert.equal(list.items.length,2);
      assert.equal((await request(`/api/coach/feedback/${betaFeedbackId}`,reviewer,{status:'approved'},'PATCH')).status,404);
      assert.equal((await request('/api/users',reviewer)).status,403);
      const result=await request(`/api/coach/feedback/${feedbackId}`,reviewer,{status:'approved',reviewerId:ids.beta,suggestedAnswer:'Open Online Stores, then edit the store analytics account.'},'PATCH');assert.equal(result.status,200);const reviewed=(await result.json()).feedback;assert.equal(reviewed.reviewerId,ids.reviewer);assert.equal(reviewed.suggestedAnswer,'Open Online Stores, then edit the store analytics account.');
      const retrieval=await request('/api/coach/retrieve',reviewer,{query:'Open Online Stores analytics account'});assert.equal(retrieval.status,200);assert.ok((await retrieval.json()).results.some((entry:any)=>entry.document.id===`correction:${feedbackId}`));
    });
    await t.test('training exports are admin-only, tenant-scoped, redacted, and contain reviewed signals only',async()=>{
      const helpful={responseId:'helpful-training',query:'Contact member@example.com about order ID: PC-9911',answer:'Call +8801712345678 and use token=supersecret',rating:'helpful'};
      assert.equal((await request('/api/coach/feedback',member,helpful)).status,201);
      assert.equal((await request('/api/coach/feedback',beta,{responseId:'beta-helpful',query:'Beta-only training prompt',answer:'Beta-only training answer',rating:'helpful'})).status,201);
      assert.equal((await request('/api/analytics/training-data',member)).status,403);
      assert.equal((await request('/api/analytics/training-data',reviewer)).status,403);
      assert.equal((await request('/api/analytics/training-data?days=7',alphaAdmin)).status,400);
      const summary=await (await request('/api/analytics/training-data?days=all',alphaAdmin)).json();
      assert.equal(summary.examples,2);assert.equal(summary.approvedCorrections,1);assert.equal(summary.helpfulAnswers,1);
      assert.equal(summary.trainExamples+summary.validationExamples,2);assert.match(summary.version,/^cc-training-v1-[a-f0-9]{16}$/);
      const exported=await request('/api/analytics/training-data/export?days=all',alphaAdmin);
      assert.equal(exported.status,200);assert.match(exported.headers.get('content-type')!,/application\/x-ndjson/);
      assert.equal(exported.headers.get('x-coach-dataset-version'),summary.version);
      const jsonl=await exported.text();const examples=jsonl.trim().split('\n').map(line=>JSON.parse(line));
      assert.equal(examples.length,2);assert.deepEqual(new Set(examples.map(example=>example.metadata.source)),new Set(['approved_correction','helpful_rating']));
      assert.doesNotMatch(jsonl,/member@example\.com|\+8801712345678|PC-9911|supersecret|Beta-only/);
      assert.match(jsonl,/REDACTED_EMAIL/);assert.match(jsonl,/REDACTED_PHONE/);assert.match(jsonl,/REDACTED_ID/);
      const isolated=await (await request('/api/analytics/training-data?days=all',beta)).json();assert.equal(isolated.examples,1);
      const betaExport=await (await request('/api/analytics/training-data/export?days=all',beta)).text();assert.match(betaExport,/Beta-only training prompt/);assert.doesNotMatch(betaExport,/member@example\.com|Open Online Stores/);
    });
    await t.test('admin account management stays in the organization and prevents removal of the last admin',async()=>{
      assert.equal((await request(`/api/users/${ids.beta}`,alphaAdmin,{role:'member',active:false},'PATCH')).status,404);
      assert.equal((await request(`/api/users/${ids.admin}`,alphaAdmin,{role:'member',active:true},'PATCH')).status,409);
      const users=await (await request('/api/users',alphaAdmin)).json();assert.equal(users.users.length,4);assert.ok(users.users.every((u:any)=>!('password_hash' in u)));
      assert.equal((await request('/api/users',member,{email:'escalate@example.com',name:'Bad',role:'admin',password})).status,403);
      assert.equal((await request('/api/users',alphaAdmin,{email:'new@example.com',name:'New user',role:'member',password})).status,201);
      const temporary=await signIn('new');assert.equal(temporary.user.must_change_password,true);
      assert.equal((await request('/api/config',temporary)).status,403);
      const nextPassword='A different strong passphrase 2026';
      assert.equal((await request('/api/auth/password',temporary,{currentPassword:password,newPassword:nextPassword})).status,200);
      assert.equal((await request('/api/auth/me',temporary)).status,401);
      const changed=await signIn('new',nextPassword);assert.equal(changed.user.must_change_password,false);
    });
    await t.test('conversation history persists privately with RLS, CSRF, and revision protection',async()=>{
      const id=randomUUID();
      const snapshot={revision:0,messages:[{id:'q1',role:'user',content:'How do orders work?',timestamp:new Date().toISOString()}],state:{mode:'quiz',quizScore:{correct:1,total:2},quizHistory:[{domain:'orders',correct:true}]},organization_id:orgB,user_id:ids.beta};
      assert.equal((await request('/api/conversations')).status,401);
      assert.equal((await request('/api/conversations/'+id,member,snapshot,'PUT',{'X-CSRF-Token':''})).status,403);
      assert.equal((await request('/api/conversations/'+id,member,{...snapshot,messages:[{}]},'PUT')).status,400);
      const saved=await request('/api/conversations/'+id,member,snapshot,'PUT');assert.equal(saved.status,200);assert.equal((await saved.json()).revision,1);
      const row=(await admin.query('SELECT organization_id,user_id FROM public.coach_conversations WHERE id=$1',[id])).rows[0];assert.deepEqual(row,{organization_id:orgA,user_id:ids.member});
      for(const login of [other,reviewer,alphaAdmin,beta]){
        assert.equal((await request('/api/conversations/'+id,login)).status,404);
        assert.equal((await (await request('/api/conversations',login)).json()).items.length,0);
        assert.equal((await request('/api/conversations/'+id,login,snapshot,'PUT')).status,409);
      }
      const repeat=await request('/api/conversations/'+id,member,snapshot,'PUT');assert.equal((await repeat.json()).revision,1);
      const relogin=await signIn('member');
      const loaded=(await (await request('/api/conversations/'+id,relogin)).json()).conversation;
      assert.deepEqual(loaded.messages,snapshot.messages);assert.deepEqual(loaded.state,snapshot.state);
      const updates=await Promise.all(['first','second'].map(content=>request('/api/conversations/'+id,member,{...snapshot,revision:1,messages:[{...snapshot.messages[0],content}]},'PUT')));
      assert.deepEqual(updates.map(response=>response.status).sort(),[200,409]);
      assert.equal((await (await request('/api/conversations',member)).json()).items[0].revision,2);
      await withSession(digest(beta.token),async client=>assert.equal((await client.query('SELECT * FROM public.coach_conversations')).rowCount,0));
      await assert.rejects(withSession(digest(member.token),client=>client.query('UPDATE public.coach_conversations SET user_id=$1 WHERE id=$2',[ids.other,id])),{code:'42501'});
      await assert.rejects(withSession(digest(member.token),client=>client.query('INSERT INTO public.coach_conversations(id,organization_id,user_id,title,messages,state) VALUES($1,$2,$3,$4,$5,$6)',[randomUUID(),orgB,ids.beta,'forged',JSON.stringify(snapshot.messages),JSON.stringify(snapshot.state)])),{code:'42501'});
      await assert.rejects(pool.query('ALTER TABLE public.coach_conversations DISABLE ROW LEVEL SECURITY'),{code:'42501'});
    });
    await t.test('Google callbacks bind existing accounts and reject replay, forgery, and unauthorized linking',async()=>{
      const {default:express}=await import('express');
      const {createGoogleRouter,googleConfig,verifiedGoogleIdentity}=await import('./auth/google');
      const {sameOrigin}=await import('./auth/middleware');
      assert.equal(googleConfig({}),undefined);
      assert.equal(googleConfig({GOOGLE_CLIENT_ID:'id',GOOGLE_CLIENT_SECRET:'secret',GOOGLE_REDIRECT_URI:'http://evil.example/api/auth/google/callback'}),undefined);
      process.env.GOOGLE_CLIENT_ID='test-client';process.env.GOOGLE_CLIENT_SECRET='test-secret';
      process.env.GOOGLE_REDIRECT_URI='http://localhost:4010/api/auth/google/callback';
      let payload:any;let exchanges=0;
      const oauth=express();oauth.use(express.json(),sameOrigin);
      // Only the external Google exchange is stubbed; cookies, state, PKCE, sessions and SQL use the real implementation.
      oauth.use('/api/auth/google',createGoogleRouter(async(_code,verifier)=>{exchanges++;assert.match(verifier,/^[\w-]{43}$/);return payload;}));
      const googleServer=oauth.listen(0,'127.0.0.1');await new Promise<void>(resolve=>googleServer.once('listening',resolve));
      const googleUrl=`http://127.0.0.1:${(googleServer.address() as {port:number}).port}/api/auth/google`;
      const begin=async()=>{
        const response=await fetch(googleUrl+'/start',{method:'POST',headers:{'Content-Type':'application/json','X-Coach-Request':'1',Origin:'http://localhost:4010'},body:'{}'});
        assert.equal(response.status,200);const target=new URL((await response.json()).url);
        assert.equal(target.hostname,'accounts.google.com');assert.equal(target.searchParams.get('code_challenge_method'),'S256');
        assert.match(target.searchParams.get('code_challenge')!,/^[\w-]{43}$/);
        assert.match(response.headers.get('set-cookie')!,/HttpOnly/);assert.match(response.headers.get('set-cookie')!,/SameSite=Lax/);
        payload={sub:'google-member',email:'member@example.com',email_verified:true,hd:'example.com',nonce:target.searchParams.get('nonce')};
        return {state:target.searchParams.get('state')!,cookie:response.headers.get('set-cookie')!.split(';')[0]};
      };
      const callback=(flow:{state:string;cookie:string})=>fetch(googleUrl+`/callback?code=test-code&state=${flow.state}`,{headers:{Cookie:flow.cookie},redirect:'manual'});
      const denied=async(change:()=>void,reason='account')=>{const flow=await begin();change();const result=await callback(flow);assert.match(result.headers.get('location')!,new RegExp(`google_error=${reason}`));assert.ok(!result.headers.get('set-cookie')!.includes('coach_session='));};
      try{
        await assert.rejects(pool.query("SELECT public.coach_google_open_session('alpha','member@example.com','sub',true,'token','csrf')"),{code:'42501'});
        const flow=await begin();const before=exchanges;
        const forged=await callback({...flow,cookie:'coach_google='+randomToken()});assert.match(forged.headers.get('location')!,/expired/);assert.equal(exchanges,before);
        const result=await callback(flow);assert.equal(result.headers.get('location'),'http://localhost:4010/');
        const cookie=result.headers.getSetCookie().find(c=>c.startsWith('coach_session='))!.split(';')[0];
        const me=await (await request('/api/auth/me',{cookie,csrf:'',token:'',user:null})).json();
        assert.equal(me.user.role,'member');assert.equal(me.user.organization_id,orgA);
        const replay=await callback(flow);assert.match(replay.headers.get('location')!,/expired/);assert.equal(exchanges,before+1);
        await denied(()=>{payload.sub='different-sub';});
        await denied(()=>{payload.email='unknown@example.com';payload.sub='unknown';});
        await denied(()=>{payload.nonce='wrong';},'failed');
        await denied(()=>{payload.email_verified=false;},'failed');
        await denied(()=>{payload.email='other@example.com';payload.sub='external';delete payload.hd;});
        const expired=await begin();await admin.query("UPDATE coach_private.google_flows SET expires_at=now()-interval '1 second'");
        assert.match((await callback(expired)).headers.get('location')!,/expired/);
        const changed=await begin();payload.email='renamed@example.com';assert.equal((await callback(changed)).headers.get('location'),'http://localhost:4010/');
        await admin.query('UPDATE coach_private.users SET must_change_password=true WHERE id=$1',[ids.member]);
        const temporary=await begin();const temporaryResult=await callback(temporary);
        const temporaryCookie=temporaryResult.headers.getSetCookie().find(c=>c.startsWith('coach_session='))!.split(';')[0];
        const googleMe=await (await request('/api/auth/me',{cookie:temporaryCookie,csrf:'',token:'',user:null})).json();assert.equal(googleMe.user.must_change_password,false);
        assert.equal((await admin.query('SELECT must_change_password FROM coach_private.users WHERE id=$1',[ids.member])).rows[0].must_change_password,true);
        await admin.query('UPDATE coach_private.users SET must_change_password=false,active=false WHERE id=$1',[ids.member]);
        await denied(()=>{});await admin.query('UPDATE coach_private.users SET active=true WHERE id=$1',[ids.member]);
        assert.equal(verifiedGoogleIdentity({...payload,email:'user@gmail.com',hd:undefined},payload.nonce).authoritative,true);
        delete process.env.GOOGLE_CLIENT_SECRET;
        assert.deepEqual(await (await fetch(googleUrl+'/config')).json(),{enabled:false});
      }finally{
        delete process.env.GOOGLE_CLIENT_ID;delete process.env.GOOGLE_CLIENT_SECRET;delete process.env.GOOGLE_REDIRECT_URI;
        await new Promise<void>(resolve=>googleServer.close(()=>resolve()));
      }
    });
    await t.test('knowledge jobs, publication, revisions and images enforce tenant and role boundaries',async()=>{
      // This fixture runs only in the disposable test database created above.
      const memberLogin=await signIn('member');
      const source='---\ntype: Guide\ntitle: Review policy\n---\nPolicy verification phrase.\n![Step](/assets/step.png)';
      const imported=await request('/api/documents/import',alphaAdmin,{bundle:'security-test',files:[{path:'policy.md',content:source}]});assert.equal(imported.status,201);
      const id=(await imported.json()).ids[0];
      const {authPool}=await import('./db');
      const {prepareDocument}=await import('./coach/worker');
      assert.equal((await request('/api/documents',memberLogin)).status,403);
      assert.equal((await request('/api/documents',reviewer)).status,200);
      assert.equal((await request(`/api/library/document?id=upload:${id}`,memberLogin)).status,404);
      assert.equal((await request(`/api/library/document?id=upload:${id}`,beta)).status,404);
      await assert.rejects(withSession(digest(alphaAdmin.token),c=>c.query("UPDATE public.coach_documents SET publication='published' WHERE id=$1",[id])),{code:'42501'});
      assert.equal((await admin.query('SELECT status FROM public.coach_documents WHERE id=$1',[id])).rows[0].status,'unprocessed');
      await assert.rejects(withSession(digest(alphaAdmin.token),c=>c.query('SELECT public.coach_save_embedding_preview($1,$2,1,$3,$4,NULL)',[randomUUID(),id,JSON.stringify([{text:'invalid',vector:[0.1]}]),'model-without-dimensions'])),{code:'22023'});
      assert.equal((await request(`/api/documents/${id}/embedding-preview`,memberLogin,{revision:1})).status,403);
      assert.equal((await request(`/api/documents/${id}/embedding-preview`,reviewer,{revision:1})).status,403);
      assert.equal((await request(`/api/documents/${id}/embedding-preview`,beta,{revision:1})).status,404);
      assert.equal((await request(`/api/documents/${id}/process`,alphaAdmin,{})).status,409);
      const previewResponse=await request(`/api/documents/${id}/embedding-preview`,alphaAdmin,{revision:1});assert.equal(previewResponse.status,201);
      const preview=await previewResponse.json();assert.equal(preview.mode,'keyword');assert.equal(preview.model,null);assert.equal(preview.chunks.length,1);assert.match(preview.chunks[0].text,/Policy verification phrase/);assert.ok(!('vectorSample' in preview.chunks[0]));
      const untouched=(await admin.query('SELECT status,jsonb_array_length(chunks) AS chunks FROM public.coach_documents WHERE id=$1',[id])).rows[0];assert.deepEqual(untouched,{status:'unprocessed',chunks:0});
      assert.equal((await request(`/api/documents/${id}/embedding-preview/${preview.id}/apply`,beta,{revision:1})).status,409);
      assert.equal((await request(`/api/documents/${id}/embedding-preview/${preview.id}/apply`,alphaAdmin,{revision:1})).status,200);
      const ready=(await admin.query('SELECT status,jsonb_array_length(chunks) AS chunks FROM public.coach_documents WHERE id=$1',[id])).rows[0];assert.deepEqual(ready,{status:'ready',chunks:1});
      const image='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
      const attached=await request(`/api/documents/${id}/attachments`,alphaAdmin,{path:'assets/step.png',base64:image});assert.equal(attached.status,201);const attachment=(await attached.json()).id;
      assert.equal((await request(`/api/library/attachments/${attachment}`,memberLogin)).status,404);
      assert.equal((await request(`/api/documents/${id}/action`,memberLogin,{action:'publish',revision:1})).status,403);
      assert.equal((await request(`/api/documents/${id}/action`,beta,{action:'publish',revision:1})).status,404);
      assert.equal((await request(`/api/documents/${id}/action`,alphaAdmin,{action:'submit',revision:1})).status,200);
      assert.equal((await request(`/api/documents/${id}/action`,reviewer,{action:'publish',revision:1})).status,200);
      assert.equal((await request(`/api/library/document?id=upload:${id}`,memberLogin)).status,200);
      assert.equal((await request(`/api/library/attachments/${attachment}`,memberLogin)).status,200);
      assert.equal((await request(`/api/library/attachments/${attachment}`,beta)).status,404);
      assert.equal((await request(`/api/library/attachments/${attachment}`)).status,401);
      assert.equal((await request(`/api/documents/${id}/action`,reviewer,{action:'edit',revision:1,content:source})).status,403);
      assert.equal((await request(`/api/documents/${id}/action`,alphaAdmin,{action:'edit',revision:1,content:source+'\nUpdated.'})).status,200);
      assert.equal((await request(`/api/library/document?id=upload:${id}`,memberLogin)).status,404);
      assert.equal((await request(`/api/library/attachments/${attachment}`,memberLogin)).status,404);
      assert.equal((await request(`/api/documents/${id}/action`,alphaAdmin,{action:'submit',revision:1})).status,409);
      const stalePreview=await (await request(`/api/documents/${id}/embedding-preview`,alphaAdmin,{revision:2})).json();
      assert.equal((await request(`/api/documents/${id}/action`,alphaAdmin,{action:'restore',revision:2,restoreRevision:1})).status,200);
      const restored=await (await request(`/api/documents/${id}/source`,alphaAdmin)).json();assert.equal(restored.content,source);assert.equal(restored.revision,3);
      await admin.query("UPDATE coach_private.embedding_previews SET expires_at=now()-interval '1 second' WHERE id=$1",[stalePreview.id]);
      assert.equal((await authPool.query('SELECT public.coach_cleanup_embedding_previews() AS removed')).rows[0].removed,1);
      assert.equal((await request(`/api/documents/${id}/embedding-preview/${stalePreview.id}/apply`,alphaAdmin,{revision:2})).status,409);
      const currentPreview=await (await request(`/api/documents/${id}/embedding-preview`,alphaAdmin,{revision:3})).json();
      assert.equal((await request(`/api/documents/${id}/embedding-preview/${currentPreview.id}/apply`,alphaAdmin,{revision:3})).status,200);
      await withSession(digest(alphaAdmin.token),c=>c.query("SELECT public.coach_document_action($1,$2,'queue')",[id,3]));
      const result=await prepareDocument(source,'policy.md',undefined);
      const retryToken=randomUUID();await authPool.query('SELECT * FROM public.coach_claim_document($1)',[retryToken]);
      await admin.query("UPDATE public.coach_documents SET lease_until=now()-interval '1 second' WHERE id=$1",[id]);
      const recoveredToken=randomUUID();const recovered=(await authPool.query('SELECT * FROM public.coach_claim_document($1)',[recoveredToken])).rows[0];assert.equal(recovered.id,id);assert.equal(recovered.attempts,2);
      assert.equal((await authPool.query('SELECT public.coach_finish_document($1,$2,$3,NULL,NULL) AS saved',[id,retryToken,JSON.stringify(result.chunks)])).rows[0].saved,false);
      await authPool.query('SELECT public.coach_finish_document($1,$2,NULL,NULL,NULL)',[id,recoveredToken]);
      assert.equal((await admin.query('SELECT status FROM public.coach_documents WHERE id=$1',[id])).rows[0].status,'queued');
      const audit=(await request('/api/operations',alphaAdmin));assert.equal(audit.status,200);assert.ok((await audit.json()).audit.some((event:any)=>event.document_id===id));
      assert.equal((await request(`/api/documents/${id}`,alphaAdmin,undefined,'DELETE')).status,200);
      assert.equal((await request(`/api/library/attachments/${attachment}`,alphaAdmin)).status,404);
    });
    await t.test('role changes, disabled accounts, logout, and expiry invalidate sessions',async()=>{
      assert.equal((await request(`/api/users/${ids.reviewer}`,alphaAdmin,{role:'member',active:true},'PATCH')).status,200);
      assert.equal((await request('/api/auth/me',reviewer)).status,401);
      const demoted=await signIn('reviewer');assert.equal((await request('/api/coach/feedback',demoted)).status,403);
      assert.equal((await request(`/api/users/${ids.other}`,alphaAdmin,{role:'member',active:false},'PATCH')).status,200);
      assert.equal((await request('/api/auth/me',other)).status,401);
      assert.equal((await request('/api/auth/logout',member,{})).status,200);assert.equal((await request('/api/auth/me',member)).status,401);
      await admin.query("UPDATE coach_private.sessions SET expires_at=now()-interval '1 second' WHERE user_id=$1",[ids.beta]);
      assert.equal((await request('/api/auth/me',beta)).status,401);
    });
  } finally { /* t.after also cleans up when setup or an assertion fails. */ }
});

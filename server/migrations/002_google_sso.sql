ALTER TABLE coach_private.users ADD COLUMN IF NOT EXISTS google_sub text;
CREATE UNIQUE INDEX IF NOT EXISTS users_google_subject ON coach_private.users(organization_id,google_sub) WHERE google_sub IS NOT NULL;
ALTER TABLE coach_private.sessions ADD COLUMN IF NOT EXISTS auth_method text NOT NULL DEFAULT 'password' CHECK(auth_method IN ('password','google'));
CREATE TABLE IF NOT EXISTS coach_private.google_flows (
 state_hash text PRIMARY KEY, browser_hash text NOT NULL, organization text NOT NULL,
 verifier text NOT NULL, nonce text NOT NULL, return_origin text NOT NULL, expires_at timestamptz NOT NULL
);
REVOKE ALL ON coach_private.google_flows FROM PUBLIC,coach_app,coach_auth;
CREATE OR REPLACE FUNCTION public.coach_google_begin(state text,browser text,org text,pkce text,flow_nonce text,origin text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 DELETE FROM coach_private.google_flows WHERE expires_at<=now() OR browser_hash=browser;
 INSERT INTO coach_private.google_flows VALUES(state,browser,org,pkce,flow_nonce,origin,now()+interval '10 minutes');
END $$;
CREATE OR REPLACE FUNCTION public.coach_google_consume(state text,browser text)
RETURNS TABLE(organization text,verifier text,nonce text,return_origin text)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 DELETE FROM coach_private.google_flows WHERE state_hash=state AND browser_hash=browser AND expires_at>now()
 RETURNING organization,verifier,nonce,return_origin
$$;
CREATE OR REPLACE FUNCTION public.coach_google_open_session(org_slug text,verified_email text,subject text,authoritative_email boolean,token text,csrf text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE target record;
BEGIN
 -- Only the trusted authentication pool calls this after validating Google's ID token.
 -- Email is used only for first binding, and only where Google is its authority.
 SELECT u.* INTO target FROM coach_private.users u JOIN coach_private.organizations o ON o.id=u.organization_id
 WHERE o.slug=org_slug AND u.active AND (u.google_sub=subject OR
   (u.google_sub IS NULL AND u.email=verified_email AND authoritative_email))
 ORDER BY (u.google_sub=subject) DESC NULLS LAST LIMIT 1 FOR UPDATE OF u;
 IF NOT FOUND THEN RETURN false; END IF;
 UPDATE coach_private.users SET google_sub=subject WHERE id=target.id;
 DELETE FROM coach_private.sessions WHERE expires_at<=now();
 INSERT INTO coach_private.sessions(token_hash,user_id,csrf_token,expires_at,auth_method)
 VALUES(token,target.id,csrf,now()+interval '12 hours','google');
 RETURN true;
END $$;
-- A verified Google session needs no temporary local password. Password sessions
-- still require the original password change; Google never changes the password hash.
CREATE OR REPLACE FUNCTION public.coach_actor()
RETURNS TABLE(id uuid, organization_id uuid, email text, name text, role text, organization_name text, organization_slug text, must_change_password boolean, csrf_token text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id,u.organization_id,u.email,u.name,u.role,o.name,o.slug,(u.must_change_password AND s.auth_method='password'),s.csrf_token
 FROM coach_private.sessions s JOIN coach_private.users u ON u.id=s.user_id JOIN coach_private.organizations o ON o.id=u.organization_id
 WHERE s.token_hash=current_setting('coach.session_hash',true) AND s.expires_at>now() AND u.active
$$;
REVOKE ALL ON FUNCTION public.coach_google_begin(text,text,text,text,text,text),public.coach_google_consume(text,text),public.coach_google_open_session(text,text,text,boolean,text,text) FROM PUBLIC,coach_app;
GRANT EXECUTE ON FUNCTION public.coach_google_begin(text,text,text,text,text,text),public.coach_google_consume(text,text),public.coach_google_open_session(text,text,text,boolean,text,text) TO coach_auth;

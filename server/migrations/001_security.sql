-- Run with the migration owner, never the web application's database login.
CREATE SCHEMA IF NOT EXISTS coach_private;
REVOKE ALL ON SCHEMA coach_private FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'coach_app') THEN
    CREATE ROLE coach_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'coach_auth') THEN
    CREATE ROLE coach_auth NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS coach_private.organizations (
 id uuid PRIMARY KEY, slug text UNIQUE NOT NULL, name text NOT NULL
);
CREATE TABLE IF NOT EXISTS coach_private.users (
 id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES coach_private.organizations(id),
 email text NOT NULL, name text NOT NULL, password_hash text NOT NULL,
 role text NOT NULL CHECK(role IN ('member','reviewer','admin')), active boolean NOT NULL DEFAULT true,
 must_change_password boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,email), UNIQUE(organization_id,id)
);
CREATE TABLE IF NOT EXISTS coach_private.sessions (
 token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES coach_private.users(id) ON DELETE CASCADE,
 csrf_token text NOT NULL, expires_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user ON coach_private.sessions(user_id);
CREATE TABLE IF NOT EXISTS public.coach_feedback (
 id uuid PRIMARY KEY, organization_id uuid NOT NULL, user_id uuid NOT NULL,
 response_id text NOT NULL, query text NOT NULL, answer text NOT NULL,
 rating text NOT NULL CHECK(rating IN ('helpful','unhelpful')),
 issue_type text CHECK(issue_type IN ('wrong-answer','wrong-screenshots','missing-information','other')),
 comment text NOT NULL DEFAULT '', suggested_answer text NOT NULL DEFAULT '',
 screenshot_ids_json jsonb NOT NULL DEFAULT '[]', retrieval_document_ids_json jsonb NOT NULL DEFAULT '[]',
 provider text NOT NULL DEFAULT '', intent_id text NOT NULL DEFAULT '',
 status text NOT NULL CHECK(status IN ('recorded','pending','approved','dismissed')),
 reviewer_id uuid, review_note text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,user_id) REFERENCES coach_private.users(organization_id,id),
 FOREIGN KEY(organization_id,reviewer_id) REFERENCES coach_private.users(organization_id,id),
 UNIQUE(organization_id,user_id,response_id)
);
CREATE INDEX IF NOT EXISTS feedback_tenant_status ON public.coach_feedback(organization_id,status,created_at DESC);

-- Identity is resolved from a live server-issued session, not client-asserted role/tenant settings.
CREATE OR REPLACE FUNCTION public.coach_actor()
RETURNS TABLE(id uuid, organization_id uuid, email text, name text, role text, organization_name text, organization_slug text, must_change_password boolean, csrf_token text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog AS $$
 SELECT u.id,u.organization_id,u.email,u.name,u.role,o.name,o.slug,u.must_change_password,s.csrf_token
 FROM coach_private.sessions s JOIN coach_private.users u ON u.id=s.user_id
 JOIN coach_private.organizations o ON o.id=u.organization_id
 WHERE s.token_hash=current_setting('coach.session_hash',true) AND s.expires_at>now() AND u.active
$$;
CREATE OR REPLACE FUNCTION public.coach_login_lookup(org_slug text, user_email text)
RETURNS TABLE(id uuid, password_hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id,u.password_hash FROM coach_private.users u JOIN coach_private.organizations o ON o.id=u.organization_id
 WHERE o.slug=org_slug AND u.email=user_email AND u.active
$$;
CREATE OR REPLACE FUNCTION public.coach_open_session(uid uuid, verified_hash text, token text, csrf text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM 1 FROM coach_private.users WHERE id=uid AND password_hash=verified_hash AND active FOR SHARE;
 IF NOT FOUND THEN RETURN false; END IF;
 DELETE FROM coach_private.sessions WHERE expires_at<=now();
 INSERT INTO coach_private.sessions(token_hash,user_id,csrf_token,expires_at) VALUES(token,uid,csrf,now()+interval '12 hours');
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.coach_logout() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 DELETE FROM coach_private.sessions WHERE token_hash=current_setting('coach.session_hash',true)
$$;
CREATE OR REPLACE FUNCTION public.coach_password_hash() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT password_hash FROM coach_private.users WHERE id=(SELECT id FROM public.coach_actor())
$$;
CREATE OR REPLACE FUNCTION public.coach_change_password(old_hash text, new_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE uid uuid := (SELECT id FROM public.coach_actor());
BEGIN
 UPDATE coach_private.users SET password_hash=new_hash,must_change_password=false WHERE id=uid AND password_hash=old_hash;
 IF NOT FOUND THEN RETURN false; END IF;
 DELETE FROM coach_private.sessions WHERE user_id=uid;
 RETURN true;
END $$;
CREATE OR REPLACE FUNCTION public.coach_list_users()
RETURNS TABLE(id uuid,email text,name text,role text,active boolean,must_change_password boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT u.id,u.email,u.name,u.role,u.active,u.must_change_password FROM coach_private.users u
 JOIN public.coach_actor() a ON a.organization_id=u.organization_id AND a.role='admin' AND NOT a.must_change_password
 ORDER BY u.created_at,u.id
$$;
CREATE OR REPLACE FUNCTION public.coach_create_user(uid uuid,user_email text,user_name text,hash text,user_role text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.role<>'admin' OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 INSERT INTO coach_private.users(id,organization_id,email,name,password_hash,role)
 VALUES(uid,actor.organization_id,user_email,user_name,hash,user_role);
 RETURN uid;
END $$;
CREATE OR REPLACE FUNCTION public.coach_update_user(uid uuid,new_role text,new_active boolean,new_hash text DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record; target record;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.role<>'admin' OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 -- Serialize membership changes so two concurrent requests cannot remove the last admin.
 PERFORM 1 FROM coach_private.organizations WHERE id=actor.organization_id FOR UPDATE;
 SELECT * INTO target FROM coach_private.users WHERE id=uid AND organization_id=actor.organization_id FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 IF target.role='admin' AND target.active AND (new_role<>'admin' OR NOT new_active)
 AND (SELECT count(*) FROM coach_private.users WHERE organization_id=actor.organization_id AND role='admin' AND active)<2
 THEN RAISE EXCEPTION 'The organization must retain an active admin.' USING ERRCODE='23514'; END IF;
 UPDATE coach_private.users SET role=new_role,active=new_active,password_hash=coalesce(new_hash,password_hash),
 must_change_password=CASE WHEN new_hash IS NOT NULL THEN true ELSE must_change_password END WHERE id=uid;
 DELETE FROM coach_private.sessions WHERE user_id=uid;
 RETURN true;
END $$;

ALTER TABLE public.coach_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_feedback FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS feedback_read ON public.coach_feedback;
CREATE POLICY feedback_read ON public.coach_feedback FOR SELECT TO coach_app USING (
 EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_feedback.organization_id AND NOT a.must_change_password
 AND (a.id=coach_feedback.user_id OR a.role IN ('reviewer','admin')))
);
DROP POLICY IF EXISTS feedback_insert ON public.coach_feedback;
CREATE POLICY feedback_insert ON public.coach_feedback FOR INSERT TO coach_app WITH CHECK (
 EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_feedback.organization_id AND a.id=coach_feedback.user_id AND NOT a.must_change_password)
 AND reviewer_id IS NULL AND review_note='' AND status=CASE WHEN rating='helpful' THEN 'recorded' ELSE 'pending' END
);
DROP POLICY IF EXISTS feedback_update ON public.coach_feedback;
CREATE POLICY feedback_update ON public.coach_feedback FOR UPDATE TO coach_app
 USING (EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_feedback.organization_id AND NOT a.must_change_password
 AND (a.id=coach_feedback.user_id OR a.role IN ('reviewer','admin'))))
 WITH CHECK (EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_feedback.organization_id AND NOT a.must_change_password
 AND (a.id=coach_feedback.user_id OR a.role IN ('reviewer','admin'))));
-- RLS controls rows; the trigger separately protects ownership and review-only columns.
CREATE OR REPLACE FUNCTION public.coach_feedback_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE actor record;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF (NEW.id,NEW.organization_id,NEW.user_id,NEW.response_id,NEW.created_at) IS DISTINCT FROM
    (OLD.id,OLD.organization_id,OLD.user_id,OLD.response_id,OLD.created_at) THEN RAISE insufficient_privilege; END IF;
 IF NEW.reviewer_id IS NOT NULL THEN
   IF actor.role NOT IN ('reviewer','admin') OR actor.id<>NEW.reviewer_id OR OLD.status<>'pending'
     OR NEW.status NOT IN ('approved','dismissed') THEN RAISE insufficient_privilege; END IF;
   IF (to_jsonb(NEW)-ARRAY['status','reviewer_id','review_note','updated_at']) IS DISTINCT FROM
      (to_jsonb(OLD)-ARRAY['status','reviewer_id','review_note','updated_at']) THEN RAISE insufficient_privilege; END IF;
 ELSE
   IF actor.id<>OLD.user_id OR NEW.review_note<>'' OR NEW.status<>(CASE WHEN NEW.rating='helpful' THEN 'recorded' ELSE 'pending' END)
   THEN RAISE insufficient_privilege; END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS feedback_guard ON public.coach_feedback;
CREATE TRIGGER feedback_guard BEFORE UPDATE ON public.coach_feedback FOR EACH ROW EXECUTE FUNCTION public.coach_feedback_guard();
REVOKE ALL ON ALL TABLES IN SCHEMA coach_private FROM PUBLIC,coach_app;
REVOKE ALL ON public.coach_feedback FROM PUBLIC,coach_app;
GRANT USAGE ON SCHEMA public TO coach_app;
GRANT SELECT,INSERT,UPDATE ON public.coach_feedback TO coach_app;
-- SECURITY DEFINER functions are private by default; explicitly expose the narrow API.
REVOKE ALL ON FUNCTION public.coach_actor(), public.coach_login_lookup(text,text), public.coach_open_session(uuid,text,text,text),
 public.coach_logout(), public.coach_password_hash(), public.coach_change_password(text,text), public.coach_list_users(),
 public.coach_create_user(uuid,text,text,text,text), public.coach_update_user(uuid,text,boolean,text), public.coach_feedback_guard() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.coach_actor(), public.coach_login_lookup(text,text), public.coach_open_session(uuid,text,text,text),
 public.coach_logout(), public.coach_password_hash(), public.coach_change_password(text,text), public.coach_list_users(),
 public.coach_create_user(uuid,text,text,text,text), public.coach_update_user(uuid,text,boolean,text) TO coach_app;

-- Login verification has its own pool/login; ordinary data queries cannot mint sessions.
REVOKE EXECUTE ON FUNCTION public.coach_login_lookup(text,text),public.coach_open_session(uuid,text,text,text) FROM coach_app;
GRANT USAGE ON SCHEMA public TO coach_auth;
GRANT EXECUTE ON FUNCTION public.coach_login_lookup(text,text),public.coach_open_session(uuid,text,text,text) TO coach_auth;

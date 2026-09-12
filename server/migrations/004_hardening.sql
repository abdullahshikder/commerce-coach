-- Shared, atomic limits survive restarts and apply across application instances.
CREATE TABLE IF NOT EXISTS coach_private.request_budgets (
 key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS request_budgets_expiry ON coach_private.request_budgets(expires_at);
REVOKE ALL ON coach_private.request_budgets FROM PUBLIC,coach_app,coach_auth;
CREATE OR REPLACE FUNCTION public.coach_take_budget(bucket text, maximum integer, window_seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE used integer;
BEGIN
 IF length(bucket)>160 OR maximum<1 OR window_seconds<1 OR window_seconds>86400 THEN RAISE invalid_parameter_value; END IF;
 DELETE FROM coach_private.request_budgets WHERE expires_at<=now();
 INSERT INTO coach_private.request_budgets AS b(key,count,expires_at) VALUES(bucket,1,now()+make_interval(secs=>window_seconds))
 ON CONFLICT(key) DO UPDATE SET count=least(b.count+1,maximum+1)
 RETURNING count INTO used;
 RETURN used<=maximum;
END $$;
REVOKE ALL ON FUNCTION public.coach_take_budget(text,integer,integer) FROM PUBLIC,coach_app;
GRANT EXECUTE ON FUNCTION public.coach_take_budget(text,integer,integer) TO coach_auth;

-- Private counters avoid weakening FORCE RLS to count across authors.
CREATE TABLE IF NOT EXISTS coach_private.conversation_usage(key text PRIMARY KEY, total integer NOT NULL);
REVOKE ALL ON coach_private.conversation_usage FROM PUBLIC,coach_app,coach_auth;
-- Block concurrent inserts while rebuilding counters on repeat deployments.
LOCK TABLE public.coach_conversations IN SHARE ROW EXCLUSIVE MODE;
-- Fail closed if the migration owner cannot see all existing records.
SET LOCAL row_security=off;
INSERT INTO coach_private.conversation_usage
 SELECT 'org:'||organization_id,count(*) FROM public.coach_conversations GROUP BY organization_id
 ON CONFLICT(key) DO UPDATE SET total=excluded.total;
INSERT INTO coach_private.conversation_usage
 SELECT 'user:'||user_id,count(*) FROM public.coach_conversations GROUP BY user_id
 ON CONFLICT(key) DO UPDATE SET total=excluded.total;
SET LOCAL row_security=on;
CREATE OR REPLACE FUNCTION public.coach_conversation_quota() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE org_total integer; user_total integer;
BEGIN
 -- Atomic counters serialize quota decisions; an exception rolls back both increments.
 INSERT INTO coach_private.conversation_usage AS usage VALUES('org:'||NEW.organization_id,1)
 ON CONFLICT(key) DO UPDATE SET total=usage.total+1 RETURNING total INTO org_total;
 INSERT INTO coach_private.conversation_usage AS usage VALUES('user:'||NEW.user_id,1)
 ON CONFLICT(key) DO UPDATE SET total=usage.total+1 RETURNING total INTO user_total;
 IF org_total>2000 OR user_total>200 THEN
 RAISE EXCEPTION 'Conversation storage quota reached' USING ERRCODE='P0001'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_conversation_quota() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS conversation_quota ON public.coach_conversations;
CREATE TRIGGER conversation_quota AFTER INSERT ON public.coach_conversations FOR EACH ROW EXECUTE FUNCTION public.coach_conversation_quota();

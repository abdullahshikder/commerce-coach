-- Shared built-in content is mirrored for SQL access, while authored files remain canonical.
CREATE TABLE IF NOT EXISTS public.coach_knowledge (
 id text PRIMARY KEY CHECK(length(id) BETWEEN 1 AND 200),
 record_type text NOT NULL CHECK(record_type IN ('merchant-faq','product-knowledge')),
 feature text NOT NULL,
 domain text NOT NULL,
 question text NOT NULL,
 answer text NOT NULL,
 keywords jsonb NOT NULL CHECK(jsonb_typeof(keywords)='array'),
 translations jsonb NOT NULL DEFAULT '{}' CHECK(jsonb_typeof(translations)='object'),
 product_status text NOT NULL,
 source text NOT NULL,
 screenshot_ids jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(screenshot_ids)='array'),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
 content_hash text NOT NULL CHECK(length(content_hash)=64),
 active boolean NOT NULL DEFAULT true,
 synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS knowledge_active_domain ON public.coach_knowledge(active,domain,record_type);
REVOKE ALL ON public.coach_knowledge FROM PUBLIC,coach_app,coach_auth;
GRANT SELECT ON public.coach_knowledge TO coach_app;

CREATE TABLE IF NOT EXISTS public.coach_query_logs (
 id uuid PRIMARY KEY,
 organization_id uuid NOT NULL,
 user_id uuid NOT NULL,
 query text NOT NULL CHECK(length(query) BETWEEN 1 AND 12000),
 answer text NOT NULL CHECK(length(answer) BETWEEN 1 AND 50000),
 provider text NOT NULL CHECK(length(provider) BETWEEN 1 AND 100),
 mode text NOT NULL CHECK(mode IN ('normal','training','quiz','troubleshoot','merchant-sim')),
 retrieval_document_ids jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(retrieval_document_ids)='array'),
 screenshot_ids jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(screenshot_ids)='array'),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,user_id) REFERENCES coach_private.users(organization_id,id)
);
CREATE INDEX IF NOT EXISTS query_logs_owner_created ON public.coach_query_logs(organization_id,user_id,created_at DESC,id);
ALTER TABLE public.coach_query_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_query_logs FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS query_logs_owner ON public.coach_query_logs;
-- Query text stays private to the person who asked it, including from tenant administrators.
CREATE POLICY query_logs_owner ON public.coach_query_logs FOR SELECT TO coach_app
 USING(EXISTS(SELECT FROM public.coach_actor() a WHERE a.id=user_id AND a.organization_id=coach_query_logs.organization_id AND NOT a.must_change_password));
DROP POLICY IF EXISTS query_logs_insert ON public.coach_query_logs;
CREATE POLICY query_logs_insert ON public.coach_query_logs FOR INSERT TO coach_app
 WITH CHECK(EXISTS(SELECT FROM public.coach_actor() a WHERE a.id=user_id AND a.organization_id=coach_query_logs.organization_id AND NOT a.must_change_password));
REVOKE ALL ON public.coach_query_logs FROM PUBLIC,coach_app,coach_auth;
GRANT SELECT,INSERT ON public.coach_query_logs TO coach_app;

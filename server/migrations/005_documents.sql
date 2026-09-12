CREATE TABLE IF NOT EXISTS public.coach_documents (
 id uuid PRIMARY KEY, organization_id uuid NOT NULL REFERENCES coach_private.organizations(id),
 created_by uuid NOT NULL, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 150),
 content text NOT NULL CHECK(octet_length(content) BETWEEN 1 AND 65536),
 content_hash text NOT NULL, status text NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','processing','ready','failed')),
 chunks jsonb NOT NULL DEFAULT '[]', model text, dimensions integer,
 error text NOT NULL DEFAULT '', processing_token uuid, lease_until timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,content_hash), FOREIGN KEY(organization_id,created_by) REFERENCES coach_private.users(organization_id,id)
);
ALTER TABLE public.coach_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_read ON public.coach_documents;
CREATE POLICY documents_read ON public.coach_documents FOR SELECT TO coach_app USING(
 EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_documents.organization_id AND NOT a.must_change_password AND (a.role='admin' OR status='ready')));
DROP POLICY IF EXISTS documents_insert ON public.coach_documents;
CREATE POLICY documents_insert ON public.coach_documents FOR INSERT TO coach_app WITH CHECK(
 EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_documents.organization_id AND a.id=created_by AND a.role='admin' AND NOT a.must_change_password));
DROP POLICY IF EXISTS documents_update ON public.coach_documents;
CREATE POLICY documents_update ON public.coach_documents FOR UPDATE TO coach_app USING(
 EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_documents.organization_id AND a.role='admin' AND NOT a.must_change_password)) WITH CHECK(
 EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_documents.organization_id AND a.role='admin' AND NOT a.must_change_password));
DROP POLICY IF EXISTS documents_delete ON public.coach_documents;
CREATE POLICY documents_delete ON public.coach_documents FOR DELETE TO coach_app USING(
 EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_documents.organization_id AND a.role='admin' AND NOT a.must_change_password));
REVOKE ALL ON public.coach_documents FROM PUBLIC,coach_app,coach_auth;
GRANT SELECT,INSERT,DELETE ON public.coach_documents TO coach_app;
GRANT UPDATE(status,chunks,model,dimensions,error,processing_token,lease_until,updated_at) ON public.coach_documents TO coach_app;

CREATE TABLE IF NOT EXISTS coach_private.document_usage(organization_id uuid PRIMARY KEY,total integer NOT NULL);
REVOKE ALL ON coach_private.document_usage FROM PUBLIC,coach_app,coach_auth;
LOCK TABLE public.coach_documents IN SHARE ROW EXCLUSIVE MODE;
SET LOCAL row_security=off;
INSERT INTO coach_private.document_usage SELECT organization_id,count(*) FROM public.coach_documents GROUP BY organization_id
 ON CONFLICT(organization_id) DO UPDATE SET total=excluded.total;
SET LOCAL row_security=on;
CREATE OR REPLACE FUNCTION public.coach_document_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE used integer;
BEGIN
 IF TG_OP='DELETE' THEN
 UPDATE coach_private.document_usage SET total=greatest(0,total-1) WHERE organization_id=OLD.organization_id;RETURN OLD;
 END IF;
 INSERT INTO coach_private.document_usage AS usage VALUES(NEW.organization_id,1)
 ON CONFLICT(organization_id) DO UPDATE SET total=usage.total+1 RETURNING total INTO used;
 IF used>50 THEN RAISE EXCEPTION 'Document quota reached' USING ERRCODE='P0002'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_document_quota() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS document_quota ON public.coach_documents;
CREATE TRIGGER document_quota AFTER INSERT OR DELETE ON public.coach_documents FOR EACH ROW EXECUTE FUNCTION public.coach_document_quota();

ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS publication text NOT NULL DEFAULT 'draft' CHECK(publication IN ('draft','review','published'));
ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 1;
ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS available_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS published_by uuid;
ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS published_at timestamptz;
CREATE INDEX IF NOT EXISTS documents_jobs ON public.coach_documents(available_at) WHERE status IN ('queued','processing');
DROP POLICY IF EXISTS documents_read ON public.coach_documents;
CREATE POLICY documents_read ON public.coach_documents FOR SELECT TO coach_app USING(EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_documents.organization_id AND NOT a.must_change_password AND (a.role IN ('admin','reviewer') OR (status='ready' AND publication='published'))));
-- Runtime callers cannot forge publication state, worker results, or revisions.
REVOKE UPDATE ON public.coach_documents FROM coach_app;
REVOKE UPDATE(status,chunks,model,dimensions,error,processing_token,lease_until,updated_at) ON public.coach_documents FROM coach_app;
REVOKE INSERT ON public.coach_documents FROM coach_app;
GRANT INSERT(id,organization_id,created_by,name,content,content_hash,okf_metadata,concept_path,bundle_name) ON public.coach_documents TO coach_app;

CREATE TABLE IF NOT EXISTS public.coach_document_versions(
 document_id uuid NOT NULL REFERENCES public.coach_documents(id) ON DELETE CASCADE, revision integer NOT NULL,
 organization_id uuid NOT NULL, content text NOT NULL, metadata jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), actor_id uuid, PRIMARY KEY(document_id,revision));
CREATE TABLE IF NOT EXISTS public.coach_audit(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, organization_id uuid NOT NULL, actor_id uuid,
 action text NOT NULL, document_id uuid, revision integer, created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.coach_document_versions ENABLE ROW LEVEL SECURITY; ALTER TABLE public.coach_document_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.coach_audit ENABLE ROW LEVEL SECURITY; ALTER TABLE public.coach_audit FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS versions_read ON public.coach_document_versions;
CREATE POLICY versions_read ON public.coach_document_versions FOR SELECT TO coach_app USING(EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_document_versions.organization_id AND a.role IN ('admin','reviewer') AND NOT a.must_change_password));
DROP POLICY IF EXISTS audit_read ON public.coach_audit;
CREATE POLICY audit_read ON public.coach_audit FOR SELECT TO coach_app USING(EXISTS(SELECT FROM public.coach_actor() a WHERE a.organization_id=coach_audit.organization_id AND a.role IN ('admin','reviewer') AND NOT a.must_change_password));
REVOKE ALL ON public.coach_document_versions,public.coach_audit FROM PUBLIC,coach_app,coach_auth;
GRANT SELECT ON public.coach_document_versions,public.coach_audit TO coach_app;
CREATE OR REPLACE FUNCTION public.coach_document_record() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid;
BEGIN
 SELECT a.id INTO actor FROM public.coach_actor() a;
 IF TG_OP='DELETE' THEN
 INSERT INTO public.coach_audit(organization_id,actor_id,action,document_id,revision) VALUES(OLD.organization_id,actor,'deleted',OLD.id,OLD.revision);RETURN OLD;
 END IF;
 IF TG_OP='INSERT' OR NEW.revision<>OLD.revision THEN
 INSERT INTO public.coach_document_versions(document_id,revision,organization_id,content,metadata,actor_id) VALUES(NEW.id,NEW.revision,NEW.organization_id,NEW.content,NEW.okf_metadata,actor) ON CONFLICT DO NOTHING;
 INSERT INTO public.coach_audit(organization_id,actor_id,action,document_id,revision) VALUES(NEW.organization_id,actor,CASE WHEN TG_OP='INSERT' THEN 'uploaded' ELSE 'revised' END,NEW.id,NEW.revision);
 END IF; RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_document_record() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS document_record ON public.coach_documents;
CREATE TRIGGER document_record AFTER INSERT OR UPDATE OR DELETE ON public.coach_documents FOR EACH ROW EXECUTE FUNCTION public.coach_document_record();
INSERT INTO public.coach_document_versions(document_id,revision,organization_id,content,metadata,actor_id) SELECT id,revision,organization_id,content,okf_metadata,created_by FROM public.coach_documents ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.coach_document_action(doc uuid, expected integer, operation text, new_content text DEFAULT NULL, new_metadata jsonb DEFAULT NULL, restore_revision integer DEFAULT NULL) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE a record; d public.coach_documents; v public.coach_document_versions;
BEGIN
 SELECT * INTO a FROM public.coach_actor();
 IF a.id IS NULL OR a.must_change_password OR a.role NOT IN ('admin','reviewer') THEN RAISE EXCEPTION 'Access denied' USING ERRCODE='42501'; END IF;
 SELECT * INTO d FROM public.coach_documents WHERE id=doc AND organization_id=a.organization_id FOR UPDATE;
 IF d.id IS NULL THEN RAISE EXCEPTION 'Document unavailable' USING ERRCODE='42501'; END IF;
 IF d.revision<>expected THEN RAISE EXCEPTION 'Revision changed' USING ERRCODE='40001'; END IF;
 IF operation IN ('edit','restore','queue','submit') AND a.role<>'admin' THEN RAISE EXCEPTION 'Admin required' USING ERRCODE='42501'; END IF;
 IF operation IN ('edit','restore') THEN
 IF d.revision>=100 THEN RAISE EXCEPTION 'Revision limit reached' USING ERRCODE='22023'; END IF;
 IF operation='restore' THEN SELECT * INTO v FROM public.coach_document_versions WHERE document_id=doc AND revision=restore_revision; IF v.document_id IS NULL THEN RAISE EXCEPTION 'Version unavailable' USING ERRCODE='22023'; END IF; new_content:=v.content;new_metadata:=v.metadata; END IF;
 IF new_content IS NULL OR octet_length(new_content) NOT BETWEEN 1 AND 65536 OR new_metadata IS NULL OR jsonb_typeof(new_metadata)<>'object' OR octet_length(new_metadata::text)>24576 THEN RAISE EXCEPTION 'Invalid source' USING ERRCODE='22023'; END IF;
 UPDATE public.coach_documents SET name=coalesce(nullif(left(new_metadata->>'title',150),''),name),content=new_content,content_hash=encode(sha256(convert_to(btrim(new_content),'UTF8')),'hex'),okf_metadata=new_metadata,revision=revision+1,publication='draft',status='queued',chunks='[]',model=NULL,dimensions=NULL,attempts=0,available_at=now(),processing_token=NULL,lease_until=NULL,published_by=NULL,published_at=NULL,updated_at=now() WHERE id=doc;
 ELSIF operation='queue' THEN
 IF d.status='processing' AND d.lease_until>now() THEN RAISE EXCEPTION 'Already processing' USING ERRCODE='40001'; END IF;
 UPDATE public.coach_documents SET status='queued',attempts=0,available_at=now(),error='',processing_token=NULL,lease_until=NULL WHERE id=doc;
 ELSIF operation='submit' THEN
 IF d.status<>'ready' OR d.publication<>'draft' THEN RAISE EXCEPTION 'Process a draft before review' USING ERRCODE='22023'; END IF;
 UPDATE public.coach_documents SET publication='review' WHERE id=doc;
 ELSIF operation='publish' THEN
 IF d.status<>'ready' OR d.publication<>'review' THEN RAISE EXCEPTION 'Ready review required' USING ERRCODE='22023'; END IF;
 IF coalesce(d.okf_metadata->>'status','stable') IN ('draft','deprecated') OR (d.okf_metadata->>'stale_after')::timestamptz<now() THEN RAISE EXCEPTION 'Concept is not current' USING ERRCODE='22023'; END IF;
 UPDATE public.coach_documents SET publication='published',published_by=a.id,published_at=now() WHERE id=doc;
 ELSIF operation='unpublish' THEN
 UPDATE public.coach_documents SET publication='draft',published_by=NULL,published_at=NULL WHERE id=doc;
 ELSE RAISE EXCEPTION 'Unknown action' USING ERRCODE='22023'; END IF;
 INSERT INTO public.coach_audit(organization_id,actor_id,action,document_id,revision) VALUES(a.organization_id,a.id,operation,doc,expected);
 RETURN (SELECT revision FROM public.coach_documents WHERE id=doc);
END $$;
REVOKE ALL ON FUNCTION public.coach_document_action(uuid,integer,text,text,jsonb,integer) FROM PUBLIC,coach_auth;
GRANT EXECUTE ON FUNCTION public.coach_document_action(uuid,integer,text,text,jsonb,integer) TO coach_app;

-- Auth pool has only narrow job capabilities, never arbitrary document UPDATE rights.
CREATE OR REPLACE FUNCTION public.coach_claim_document(token uuid) RETURNS SETOF public.coach_documents LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtext('coach-document-workers'));
 UPDATE public.coach_documents SET status='failed',error='Worker interrupted after three attempts.',processing_token=NULL,lease_until=NULL WHERE status='processing' AND lease_until<now() AND attempts>=3;
 IF (SELECT count(*) FROM public.coach_documents WHERE status='processing' AND lease_until>now())>=3 THEN RETURN; END IF;
 RETURN QUERY UPDATE public.coach_documents SET status='processing',processing_token=token,lease_until=now()+interval '2 minutes',attempts=attempts+1,error='',updated_at=now() WHERE id=(SELECT id FROM public.coach_documents WHERE (status='queued' AND available_at<=now()) OR (status='processing' AND lease_until<now() AND attempts<3) ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *;
END $$;
CREATE OR REPLACE FUNCTION public.coach_finish_document(doc uuid,token uuid,result jsonb,embedding_model text,embedding_dimensions integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE d public.coach_documents;
BEGIN
 SELECT * INTO d FROM public.coach_documents WHERE id=doc AND processing_token=token AND status='processing' AND lease_until>now() FOR UPDATE;
 IF d.id IS NULL THEN RETURN false; END IF;
 IF result IS NULL THEN
 UPDATE public.coach_documents SET status=CASE WHEN attempts<3 THEN 'queued' ELSE 'failed' END,available_at=now()+make_interval(secs=>attempts*15),error='Processing failed. Retry or check provider configuration.',lease_until=NULL,processing_token=NULL,updated_at=now() WHERE id=doc;
 ELSE
 IF jsonb_typeof(result)<>'array' OR jsonb_array_length(result) NOT BETWEEN 1 AND 48 OR octet_length(result::text)>4194304 THEN RAISE EXCEPTION 'Invalid result'; END IF;
 UPDATE public.coach_documents SET chunks=result,model=embedding_model,dimensions=embedding_dimensions,status='ready',error='',lease_until=NULL,processing_token=NULL,updated_at=now() WHERE id=doc;
 END IF;
 INSERT INTO public.coach_audit(organization_id,action,document_id,revision) VALUES(d.organization_id,CASE WHEN result IS NULL THEN 'processing_failed' ELSE 'processed' END,doc,d.revision);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.coach_claim_document(uuid),public.coach_finish_document(uuid,uuid,jsonb,text,integer) FROM PUBLIC,coach_app;
GRANT EXECUTE ON FUNCTION public.coach_claim_document(uuid),public.coach_finish_document(uuid,uuid,jsonb,text,integer) TO coach_auth;

CREATE TABLE IF NOT EXISTS public.coach_attachments(id uuid PRIMARY KEY,document_id uuid NOT NULL REFERENCES public.coach_documents(id) ON DELETE CASCADE,organization_id uuid NOT NULL,path text NOT NULL CHECK(length(path) BETWEEN 1 AND 500),mime text NOT NULL CHECK(mime IN ('image/png','image/jpeg')),data bytea NOT NULL CHECK(octet_length(data) BETWEEN 1 AND 5242880),created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(document_id,path));
ALTER TABLE public.coach_attachments ENABLE ROW LEVEL SECURITY; ALTER TABLE public.coach_attachments FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS attachments_read ON public.coach_attachments;
CREATE POLICY attachments_read ON public.coach_attachments FOR SELECT TO coach_app USING(EXISTS(SELECT FROM public.coach_documents d WHERE d.id=document_id));
DROP POLICY IF EXISTS attachments_insert ON public.coach_attachments;
CREATE POLICY attachments_insert ON public.coach_attachments FOR INSERT TO coach_app WITH CHECK(EXISTS(SELECT FROM public.coach_documents d,public.coach_actor() a WHERE d.id=document_id AND d.organization_id=coach_attachments.organization_id AND a.organization_id=d.organization_id AND a.role='admin' AND NOT a.must_change_password AND d.publication='draft'));
REVOKE ALL ON public.coach_attachments FROM PUBLIC,coach_app,coach_auth;
GRANT SELECT,INSERT ON public.coach_attachments TO coach_app;
CREATE OR REPLACE FUNCTION public.coach_attachment_quota() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE d public.coach_documents; a record;
BEGIN
 SELECT * INTO a FROM public.coach_actor();
 SELECT * INTO d FROM public.coach_documents WHERE id=NEW.document_id FOR UPDATE;
 IF a.id IS NULL OR a.must_change_password OR a.role<>'admin' OR a.organization_id<>NEW.organization_id OR d.organization_id<>NEW.organization_id OR d.publication<>'draft' THEN RAISE EXCEPTION 'Draft administrator required' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(NEW.organization_id::text));
 IF (SELECT count(*) FROM public.coach_attachments WHERE organization_id=NEW.organization_id)>=100 OR (SELECT coalesce(sum(octet_length(data)),0) FROM public.coach_attachments WHERE organization_id=NEW.organization_id)+octet_length(NEW.data)>52428800 THEN RAISE EXCEPTION 'Attachment quota reached' USING ERRCODE='22023'; END IF;
 INSERT INTO public.coach_audit(organization_id,actor_id,action,document_id) SELECT NEW.organization_id,a.id,'attachment_added',NEW.document_id FROM public.coach_actor() a;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_attachment_quota() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS attachment_quota ON public.coach_attachments;
CREATE TRIGGER attachment_quota BEFORE INSERT ON public.coach_attachments FOR EACH ROW EXECUTE FUNCTION public.coach_attachment_quota();

CREATE OR REPLACE FUNCTION public.coach_account_audit() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.role<>OLD.role OR NEW.active<>OLD.active OR NEW.password_hash<>OLD.password_hash THEN
 INSERT INTO public.coach_audit(organization_id,actor_id,action) SELECT NEW.organization_id,a.id,CASE WHEN TG_OP='INSERT' THEN 'account_created' ELSE 'account_access_changed' END FROM public.coach_actor() a;
 END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_account_audit() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS account_audit ON coach_private.users;
CREATE TRIGGER account_audit BEFORE INSERT OR UPDATE ON coach_private.users FOR EACH ROW EXECUTE FUNCTION public.coach_account_audit();

ALTER TABLE public.coach_documents ALTER COLUMN status SET DEFAULT 'unprocessed';
ALTER TABLE public.coach_documents DROP CONSTRAINT IF EXISTS coach_documents_status_check;
ALTER TABLE public.coach_documents ADD CONSTRAINT coach_documents_status_check
  CHECK(status IN ('unprocessed','queued','processing','ready','failed'));

CREATE OR REPLACE FUNCTION public.coach_document_unprocessed_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.revision<>OLD.revision THEN NEW.status:='unprocessed'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.coach_document_unprocessed_revision() FROM PUBLIC,coach_app,coach_auth;
DROP TRIGGER IF EXISTS document_unprocessed_revision ON public.coach_documents;
CREATE TRIGGER document_unprocessed_revision BEFORE UPDATE ON public.coach_documents
FOR EACH ROW EXECUTE FUNCTION public.coach_document_unprocessed_revision();

CREATE TABLE IF NOT EXISTS coach_private.embedding_previews(
 id uuid PRIMARY KEY,
 document_id uuid NOT NULL REFERENCES public.coach_documents(id) ON DELETE CASCADE,
 organization_id uuid NOT NULL REFERENCES coach_private.organizations(id),
 created_by uuid NOT NULL REFERENCES coach_private.users(id),
 revision integer NOT NULL,
 content_hash text NOT NULL,
 chunks jsonb NOT NULL,
 model text,
 dimensions integer,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '30 minutes',
 UNIQUE(document_id)
);
CREATE INDEX IF NOT EXISTS embedding_previews_expiry ON coach_private.embedding_previews(expires_at);
REVOKE ALL ON coach_private.embedding_previews FROM PUBLIC,coach_app,coach_auth;

CREATE OR REPLACE FUNCTION public.coach_save_embedding_preview(
 preview_id uuid, doc uuid, expected_revision integer, result jsonb, embedding_model text, embedding_dimensions integer
) RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record; document public.coach_documents; expiry timestamptz:=now()+interval '30 minutes';
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.role<>'admin' OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 SELECT * INTO document FROM public.coach_documents
   WHERE id=doc AND organization_id=actor.organization_id FOR UPDATE;
 IF document.id IS NULL THEN RAISE insufficient_privilege; END IF;
 IF document.revision<>expected_revision OR document.publication<>'draft' THEN
   RAISE EXCEPTION 'Document changed' USING ERRCODE='40001';
 END IF;
 IF jsonb_typeof(result)<>'array' OR jsonb_array_length(result) NOT BETWEEN 1 AND 48
    OR octet_length(result::text)>4194304
    OR EXISTS(SELECT 1 FROM jsonb_array_elements(result) item WHERE jsonb_typeof(item)<>'object' OR jsonb_typeof(item->'text') IS DISTINCT FROM 'string') THEN
   RAISE EXCEPTION 'Invalid embedding preview' USING ERRCODE='22023';
 END IF;
 IF embedding_model IS NULL THEN
   IF embedding_dimensions IS NOT NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(result) item WHERE item ? 'vector') THEN
     RAISE EXCEPTION 'Invalid keyword preview' USING ERRCODE='22023';
   END IF;
 ELSE
   IF length(embedding_model) NOT BETWEEN 1 AND 200 OR embedding_dimensions IS NULL OR embedding_dimensions NOT BETWEEN 1 AND 10000
      OR EXISTS(SELECT 1 FROM jsonb_array_elements(result) item WHERE
        CASE WHEN jsonb_typeof(item->'vector') IS DISTINCT FROM 'array' THEN true ELSE
          jsonb_array_length(item->'vector')<>embedding_dimensions
          OR EXISTS(SELECT 1 FROM jsonb_array_elements(item->'vector') value WHERE jsonb_typeof(value)<>'number') END) THEN
     RAISE EXCEPTION 'Invalid semantic preview' USING ERRCODE='22023';
   END IF;
 END IF;
 DELETE FROM coach_private.embedding_previews WHERE expires_at<=now() OR document_id=doc;
 INSERT INTO coach_private.embedding_previews(id,document_id,organization_id,created_by,revision,content_hash,chunks,model,dimensions,expires_at)
 VALUES(preview_id,doc,actor.organization_id,actor.id,document.revision,document.content_hash,result,embedding_model,embedding_dimensions,expiry);
 INSERT INTO public.coach_audit(organization_id,actor_id,action,document_id,revision)
 VALUES(actor.organization_id,actor.id,'embedding_previewed',doc,document.revision);
 RETURN expiry;
END $$;

CREATE OR REPLACE FUNCTION public.coach_apply_embedding_preview(preview_id uuid, doc uuid, expected_revision integer) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor record; document public.coach_documents; preview coach_private.embedding_previews;
BEGIN
 SELECT * INTO actor FROM public.coach_actor();
 IF actor.id IS NULL OR actor.role<>'admin' OR actor.must_change_password THEN RAISE insufficient_privilege; END IF;
 SELECT * INTO preview FROM coach_private.embedding_previews
   WHERE id=preview_id AND document_id=doc AND organization_id=actor.organization_id AND expires_at>now() FOR UPDATE;
 IF preview.id IS NULL THEN RETURN false; END IF;
 SELECT * INTO document FROM public.coach_documents
   WHERE id=doc AND organization_id=actor.organization_id FOR UPDATE;
 IF document.id IS NULL THEN RAISE insufficient_privilege; END IF;
 IF document.revision<>expected_revision OR document.revision<>preview.revision
    OR document.content_hash<>preview.content_hash OR document.publication<>'draft' THEN RETURN false; END IF;
 UPDATE public.coach_documents SET chunks=preview.chunks,model=preview.model,dimensions=preview.dimensions,
   status='ready',error='',attempts=0,available_at=now(),processing_token=NULL,lease_until=NULL,updated_at=now()
 WHERE id=doc;
 DELETE FROM coach_private.embedding_previews WHERE id=preview_id;
 INSERT INTO public.coach_audit(organization_id,actor_id,action,document_id,revision)
 VALUES(actor.organization_id,actor.id,'embedding_saved',doc,document.revision);
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.coach_cleanup_embedding_previews() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE removed integer;
BEGIN
 DELETE FROM coach_private.embedding_previews WHERE expires_at<=now();
 GET DIAGNOSTICS removed=ROW_COUNT;
 RETURN removed;
END $$;

REVOKE ALL ON FUNCTION public.coach_save_embedding_preview(uuid,uuid,integer,jsonb,text,integer),
 public.coach_apply_embedding_preview(uuid,uuid,integer),public.coach_cleanup_embedding_previews() FROM PUBLIC,coach_app,coach_auth;
GRANT EXECUTE ON FUNCTION public.coach_save_embedding_preview(uuid,uuid,integer,jsonb,text,integer),
 public.coach_apply_embedding_preview(uuid,uuid,integer) TO coach_app;
GRANT EXECUTE ON FUNCTION public.coach_cleanup_embedding_previews() TO coach_auth;

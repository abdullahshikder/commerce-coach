ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS okf_metadata jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS concept_path text;
ALTER TABLE public.coach_documents ADD COLUMN IF NOT EXISTS bundle_name text;
-- Original source and all extension metadata are retained; only admins can insert.
CREATE UNIQUE INDEX IF NOT EXISTS documents_bundle_path ON public.coach_documents(organization_id,bundle_name,concept_path) WHERE bundle_name IS NOT NULL;

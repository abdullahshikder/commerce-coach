CREATE TABLE IF NOT EXISTS public.coach_conversations (
 id uuid PRIMARY KEY, organization_id uuid NOT NULL, user_id uuid NOT NULL,
 title text NOT NULL CHECK(length(title) BETWEEN 1 AND 120),
 messages jsonb NOT NULL CHECK(jsonb_typeof(messages)='array' AND jsonb_array_length(messages) BETWEEN 1 AND 200),
 state jsonb NOT NULL CHECK(jsonb_typeof(state)='object'),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(organization_id,user_id) REFERENCES coach_private.users(organization_id,id)
);
CREATE INDEX IF NOT EXISTS conversations_owner_updated ON public.coach_conversations(organization_id,user_id,updated_at DESC,id);
ALTER TABLE public.coach_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_conversations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversations_owner ON public.coach_conversations;
-- Conversations remain private to their author, including from other admins in the same tenant.
CREATE POLICY conversations_owner ON public.coach_conversations FOR ALL TO coach_app
 USING(EXISTS(SELECT FROM public.coach_actor() a WHERE a.id=user_id AND a.organization_id=coach_conversations.organization_id AND NOT a.must_change_password))
 WITH CHECK(EXISTS(SELECT FROM public.coach_actor() a WHERE a.id=user_id AND a.organization_id=coach_conversations.organization_id AND NOT a.must_change_password));
REVOKE ALL ON public.coach_conversations FROM PUBLIC,coach_app,coach_auth;
GRANT SELECT,INSERT ON public.coach_conversations TO coach_app;
-- Ownership, identifiers and creation times cannot be changed even through direct runtime SQL.
GRANT UPDATE(title,messages,state,revision,updated_at) ON public.coach_conversations TO coach_app;

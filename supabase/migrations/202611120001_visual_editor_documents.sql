CREATE TABLE IF NOT EXISTS public.visual_editor_documents (
  id text PRIMARY KEY,
  data jsonb NOT NULL CHECK (jsonb_typeof(data) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.visual_editor_documents ENABLE ROW LEVEL SECURITY;
DO $permissions$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN REVOKE ALL ON public.visual_editor_documents FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN REVOKE ALL ON public.visual_editor_documents FROM authenticated; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN GRANT ALL ON public.visual_editor_documents TO service_role; END IF;
END $permissions$;

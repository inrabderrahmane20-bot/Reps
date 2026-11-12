CREATE TABLE IF NOT EXISTS public.category_search_counts (
  id text PRIMARY KEY,
  searches bigint NOT NULL DEFAULT 0 CHECK (searches >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.category_search_counts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.category_search_counts FROM anon, authenticated;
GRANT ALL ON public.category_search_counts TO service_role;

BEGIN;
CREATE TABLE IF NOT EXISTS public.security_rate_limits (
  key text PRIMARY KEY, hits integer NOT NULL, expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS security_rate_limits_expiry ON public.security_rate_limits(expires_at);
CREATE TABLE IF NOT EXISTS public.security_audit (
  id uuid PRIMARY KEY, occurred_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS security_audit_date ON public.security_audit(occurred_at);
ALTER TABLE public.security_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_rate_limits, public.security_audit FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON public.security_rate_limits,public.security_audit FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON public.security_rate_limits,public.security_audit FROM authenticated; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN
    GRANT SELECT,INSERT,UPDATE,DELETE ON public.security_rate_limits TO service_role;
    GRANT SELECT,INSERT ON public.security_audit TO service_role;
  END IF;
END $$;
-- Legacy bearer tokens were stored in plaintext. Require a fresh sign-in on upgrade.
DELETE FROM public.sessions WHERE NOT (data ? 'securityVersion');
-- Disable credentials distributed in the old seed, including in already-seeded databases.
UPDATE public.users SET data = data || '{"passwordHash":"","salt":"","passwordResetRequired":true}'::jsonb
WHERE lower(data->>'email')='admin@medina.ma' AND NOT (data ? 'credentialsRotatedAt');
COMMIT;

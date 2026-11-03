DO $migration$
DECLARE
  collection_name text;
BEGIN
  FOREACH collection_name IN ARRAY ARRAY[
    'users',
    'sessions',
    'serviceRequests',
    'reviews',
    'news',
    'communities',
    'communityPosts',
    'activities',
    'meetingProfiles',
    'meetingRequests',
    'conversations',
    'messages',
    'rooms',
    'roomMessages',
    'notifications',
    'reports',
    'favorites',
    'invitations',
    'savedSearches',
    'categories',
    'places',
    'listings'
  ]
  LOOP
    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS public.%I (
        record_key text PRIMARY KEY,
        data jsonb NOT NULL CHECK (jsonb_typeof(data) = ''object'')
      )',
      collection_name
    );
  END LOOP;
END
$migration$;

CREATE TABLE IF NOT EXISTS public.app_meta (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

DO $permissions$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users',
    'sessions',
    'serviceRequests',
    'reviews',
    'news',
    'communities',
    'communityPosts',
    'activities',
    'meetingProfiles',
    'meetingRequests',
    'conversations',
    'messages',
    'rooms',
    'roomMessages',
    'notifications',
    'reports',
    'favorites',
    'invitations',
    'savedSearches',
    'categories',
    'places',
    'listings',
    'app_meta'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', table_name);
  END LOOP;
END
$permissions$;

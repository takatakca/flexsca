-- Directory polish.
-- 1. Sort key that ignores leading punctuation and accents-insensitive case, so the default
--    list does not open on names such as ".Trouvetonauto.com" or "'Olu 'Olu".
--    Numbered companies ("9278-0592 Québec inc.") sort after the named ones.
ALTER TABLE public.business_listings DROP COLUMN IF EXISTS sort_name;
ALTER TABLE public.business_listings ADD COLUMN sort_name text GENERATED ALWAYS AS (
  CASE WHEN regexp_replace(name, '^[^[:alnum:]]+', '') ~ '^[0-9]' THEN 'zzzz' ELSE '' END || lower(regexp_replace(name, '^[^[:alnum:]]+', ''))
) STORED;
CREATE INDEX IF NOT EXISTS business_listings_sort_idx ON public.business_listings (sort_name) WHERE status <> 'removed';
CREATE INDEX IF NOT EXISTS business_listings_trade_sort_idx ON public.business_listings (trade, sort_name) WHERE status <> 'removed';
GRANT SELECT (sort_name) ON public.business_listings TO anon, authenticated;
-- 2. Towns written in capitals in the source become "Shawinigan-Sud".
UPDATE public.business_listings SET city = initcap(city) WHERE city = upper(city) AND city ~ '[A-Z]{3}';

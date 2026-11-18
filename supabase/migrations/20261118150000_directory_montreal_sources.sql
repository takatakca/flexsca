-- More open sources for the directory: Ville de Montréal food establishments and
-- street-level businesses (both CC BY 4.0). `activity` is the source's own description.
ALTER TABLE public.business_listings DROP CONSTRAINT IF EXISTS business_listings_source_check;
ALTER TABLE public.business_listings ADD CONSTRAINT business_listings_source_check CHECK (source IN ('rbq','mtl_food','mtl_shops'));
ALTER TABLE public.business_listings ADD COLUMN IF NOT EXISTS activity text CHECK (activity IS NULL OR char_length(activity) <= 120);
GRANT SELECT (activity) ON public.business_listings TO anon, authenticated;
CREATE INDEX IF NOT EXISTS business_listings_trade_name_idx ON public.business_listings (trade, name) WHERE status <> 'removed';

-- OpenStreetMap as a directory source (ODbL: credit "© OpenStreetMap contributors";
-- the rows with source = 'osm' must be shareable under ODbL on request).
ALTER TABLE public.business_listings DROP CONSTRAINT IF EXISTS business_listings_source_check;
ALTER TABLE public.business_listings ADD CONSTRAINT business_listings_source_check CHECK (source IN ('rbq','mtl_food','mtl_shops','opc','sit','osm'));
CREATE INDEX IF NOT EXISTS business_listings_lname_lcity_idx ON public.business_listings (lower(name), lower(city));

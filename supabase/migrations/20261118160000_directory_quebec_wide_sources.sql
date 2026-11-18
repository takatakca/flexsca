-- Province-wide open sources (CC BY 4.0, Données Québec): Office de la protection du
-- consommateur permit holders and the tourism ministry's SIT Québec establishments.
ALTER TABLE public.business_listings DROP CONSTRAINT IF EXISTS business_listings_source_check;
ALTER TABLE public.business_listings ADD CONSTRAINT business_listings_source_check CHECK (source IN ('rbq','mtl_food','mtl_shops','opc','sit'));

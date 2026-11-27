-- Sherbrooke's open business directory as a directory source.
-- Entreprendre Sherbrooke, "Répertoire des locaux et entreprises du territoire de Sherbrooke",
-- Données Québec, CC0 1.0 (public domain): commercial use allowed, no condition.
ALTER TABLE public.business_listings DROP CONSTRAINT IF EXISTS business_listings_source_check;
ALTER TABLE public.business_listings ADD CONSTRAINT business_listings_source_check
  CHECK (source IN ('rbq','mtl_food','mtl_shops','opc','sit','osm','shb'));

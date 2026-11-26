-- Directory clean-up, second pass.
-- 1. The same business listed by two registers in the same town and borough: keep one page.
--    The contractor register (rbq) wins over the others, then the consumer-protection, tourism and
--    municipal registers, then OpenStreetMap. A claimed page is never hidden.
WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY lower(btrim(COALESCE(other_name, name))), lower(city), lower(COALESCE(region, ''))
      ORDER BY (status = 'claimed') DESC,
        CASE source WHEN 'rbq' THEN 1 WHEN 'opc' THEN 2 WHEN 'sit' THEN 3 WHEN 'mtl_food' THEN 4 WHEN 'mtl_shops' THEN 5 ELSE 6 END,
        created_at, id
    ) AS position
  FROM public.business_listings WHERE status IN ('listed', 'claimed')
)
UPDATE public.business_listings b SET status = 'removed'
FROM ranked r WHERE r.id = b.id AND r.position > 1 AND b.status = 'listed';

-- 2. The same business in the contractor register and in OpenStreetMap, where OpenStreetMap gives no borough.
UPDATE public.business_listings o SET status = 'removed'
WHERE o.status = 'listed' AND o.source = 'osm'
  AND EXISTS (
    SELECT 1 FROM public.business_listings r
    WHERE r.status IN ('listed', 'claimed') AND r.source <> 'osm' AND r.id <> o.id
      AND lower(btrim(COALESCE(r.other_name, r.name))) = lower(btrim(COALESCE(o.other_name, o.name)))
      AND lower(r.city) = lower(o.city)
  );

-- 3. Trades that the business name states plainly.
UPDATE public.business_listings SET trade = 'Home and repair services'
WHERE status = 'listed' AND trade = 'Construction and renovation' AND COALESCE(other_name, name) ~* '\m(serrurier|serrurerie|locksmith)';
UPDATE public.business_listings SET trade = 'Heating and cooling'
WHERE status = 'listed' AND trade IN ('Plumbing', 'Construction and renovation', 'Electrical')
  AND COALESCE(other_name, name) ~* '(climatisation|ventilation|réfrigération|refrigeration|thermopompe)'
  AND COALESCE(other_name, name) !~* '(plomb|électri|electri)';

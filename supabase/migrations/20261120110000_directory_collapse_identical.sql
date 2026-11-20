-- One listing per name, town and borough: branches that cannot be told apart are shown once.
-- Claimed listings are never hidden.
WITH ranked AS (
  SELECT id, status, row_number() OVER (PARTITION BY lower(name), lower(city), coalesce(lower(region), '')
    ORDER BY (status = 'claimed') DESC, (source = 'rbq') DESC, created_at, id) AS rn
  FROM public.business_listings WHERE status IN ('listed', 'claimed')
)
UPDATE public.business_listings b SET status = 'removed' FROM ranked r WHERE r.id = b.id AND r.rn > 1 AND b.status = 'listed';

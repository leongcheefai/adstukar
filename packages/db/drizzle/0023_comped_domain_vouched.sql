-- A complimentary slot carries the admin's word for its domain (docs/adr/0014):
-- the admin named the destination, so the member has no token to publish. The
-- comps opened before that rule waited on a check the member never ran, and the
-- review could not approve them. Each still live is verified here, as a new one
-- is at the moment it opens. The review still gates the term.
UPDATE "campaign" AS c
SET "verified_at" = now(),
    "state" = CASE WHEN c."state" = 'draft' THEN 'active' ELSE c."state" END,
    "updated_at" = now()
WHERE c."verified_at" IS NULL
  AND EXISTS (
    SELECT 1 FROM "slot" AS s
    WHERE s."campaign_id" = c."id"
      AND s."comped"
      AND s."state" IN ('booked', 'running')
  );

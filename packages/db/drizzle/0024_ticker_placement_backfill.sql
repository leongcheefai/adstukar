-- The set is the screen (docs/adr/0016). Every live device gets the ticker
-- region `/ring` opens its plays on, and every device at the old default cap
-- (500) moves to the new one (1000, economy.caps.dailyPlaysPerDevice). A cap of
-- any other number is left alone. The 12 and the 180 copy economy.placement's
-- defaults; the crawl does not read them.
INSERT INTO "placement" ("id", "device_id", "format", "size", "dwell_seconds", "gap_seconds")
SELECT gen_random_uuid()::text, d."id", 'ticker', 'medium', 12, 180
FROM "device" d
WHERE d."state" <> 'archived'
  AND NOT EXISTS (
    SELECT 1 FROM "placement" p WHERE p."device_id" = d."id" AND p."format" = 'ticker'
  );
--> statement-breakpoint
UPDATE "device" SET "daily_play_cap" = 1000 WHERE "daily_play_cap" = 500;

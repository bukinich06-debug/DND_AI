-- Migrate ranged weapons from mainHand/offHand to ranged slot
-- First, add 'ranged' property to items with catalogKey matching ranged weapons
UPDATE item
SET properties = jsonb_set(
  COALESCE(properties, '[]'::jsonb),
  '{999}',
  '{"type": "ranged", "text": "Дальнобойное."}'::jsonb,
  true
)
WHERE 
  kind = 'weapon'
  AND (
    "catalogKey" IN ('longbow', 'shortbow', 'lightCrossbow', 'heavyCrossbow', 'handCrossbow', 'sling', 'blowgun')
    OR (
      "catalogKey" IS NULL 
      AND LOWER(name) IN (
        'длинный лук', 'long bow', 'longbow',
        'короткий лук', 'short bow', 'shortbow',
        'лёгкий арбалет', 'легкий арбалет', 'light crossbow', 'lightcrossbow',
        'тяжёлый арбалет', 'тяжелый арбалет', 'heavy crossbow', 'heavycrossbow',
        'ручной арбалет', 'hand crossbow', 'handcrossbow',
        'праща', 'sling',
        'духовая трубка', 'blowgun'
      )
    )
  )
  AND NOT EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(COALESCE(properties, '[]'::jsonb)) AS prop
    WHERE prop->>'type' = 'ranged'
  );

-- Move ranged weapons from mainHand/offHand to ranged slot
-- For each player, if they have multiple ranged weapons equipped, keep only one in ranged slot
WITH ranged_weapons AS (
  SELECT 
    id,
    "playerId",
    "equipSlot",
    ROW_NUMBER() OVER (PARTITION BY "playerId" ORDER BY id) as rn
  FROM item
  WHERE 
    kind = 'weapon'
    AND "equipSlot" IN ('mainHand', 'offHand')
    AND (
      "catalogKey" IN ('longbow', 'shortbow', 'lightCrossbow', 'heavyCrossbow', 'handCrossbow', 'sling', 'blowgun')
      OR (
        "catalogKey" IS NULL 
        AND LOWER(name) IN (
          'длинный лук', 'long bow', 'longbow',
          'короткий лук', 'short bow', 'shortbow',
          'лёгкий арбалет', 'легкий арбалет', 'light crossbow', 'lightcrossbow',
          'тяжёлый арбалет', 'тяжелый арбалет', 'heavy crossbow', 'heavycrossbow',
          'ручной арбалет', 'hand crossbow', 'handcrossbow',
          'праща', 'sling',
          'духовая трубка', 'blowgun'
        )
      )
      OR EXISTS (
        SELECT 1 
        FROM jsonb_array_elements(COALESCE(properties, '[]'::jsonb)) AS prop
        WHERE prop->>'type' = 'ranged'
      )
    )
)
UPDATE item
SET "equipSlot" = CASE 
  WHEN rn = 1 THEN 'ranged'::EquipSlot
  ELSE NULL
END
FROM ranged_weapons
WHERE item.id = ranged_weapons.id;

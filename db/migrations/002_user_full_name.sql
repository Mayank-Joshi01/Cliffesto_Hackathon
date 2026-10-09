ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name text NOT NULL DEFAULT '';

UPDATE users
SET full_name = name
WHERE btrim(full_name) = ''
  AND name IS NOT NULL
  AND btrim(name) <> '';

UPDATE users
SET name = full_name
WHERE (name IS NULL OR btrim(name) = '')
  AND btrim(full_name) <> '';

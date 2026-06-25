-- Add image_hash column for grouping schema versions from the same photo
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS image_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_schemas_image_hash ON schemas(image_hash);

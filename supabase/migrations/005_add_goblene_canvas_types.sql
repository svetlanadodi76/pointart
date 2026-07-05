-- Add goblene mesh canvas types and craft type to CHECK constraints
ALTER TABLE schemas
  DROP CONSTRAINT IF EXISTS schemas_canvas_type_check;

ALTER TABLE schemas
  ADD CONSTRAINT schemas_canvas_type_check
  CHECK (canvas_type IN ('11CT', '14CT', '16CT', '18CT', '2.5mm', '2.8mm', '3.0mm', '10mesh', '12mesh', '14mesh', '18mesh'));

-- Ensure craft_type allows goblene (drop & recreate if constraint exists)
ALTER TABLE schemas
  DROP CONSTRAINT IF EXISTS schemas_craft_type_check;

ALTER TABLE schemas
  ADD CONSTRAINT schemas_craft_type_check
  CHECK (craft_type IN ('cross_stitch', 'goblene', 'diamond'));

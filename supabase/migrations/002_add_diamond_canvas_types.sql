-- Add diamond canvas types (2.5mm, 2.8mm, 3.0mm) to CHECK constraint
ALTER TABLE schemas
  DROP CONSTRAINT IF EXISTS schemas_canvas_type_check;

ALTER TABLE schemas
  ADD CONSTRAINT schemas_canvas_type_check
  CHECK (canvas_type IN ('11CT', '14CT', '16CT', '18CT', '2.5mm', '2.8mm', '3.0mm'));

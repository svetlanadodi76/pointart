-- Adaugă 'mini_cross' la valorile permise pentru craft_type
-- Trebuie să ștergem vechiul constraint și să-l recreăm cu valoarea nouă
ALTER TABLE schemas DROP CONSTRAINT IF EXISTS schemas_craft_type_check;
ALTER TABLE schemas ADD CONSTRAINT schemas_craft_type_check
  CHECK (craft_type IN ('cross_stitch', 'goblene', 'diamond', 'mini_cross'));

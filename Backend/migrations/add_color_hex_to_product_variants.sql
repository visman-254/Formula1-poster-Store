-- Add color_hex column to product_variants for storing color swatch hex values
-- This allows admins to select colors from a palette and have them show as visual swatches on the frontend

ALTER TABLE product_variants ADD COLUMN color_hex VARCHAR(7) DEFAULT NULL AFTER color;
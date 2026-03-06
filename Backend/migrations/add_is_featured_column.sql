-- Add is_featured column to products table
ALTER TABLE products ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;

-- Update index for better query performance
CREATE INDEX idx_products_is_featured ON products(is_featured);

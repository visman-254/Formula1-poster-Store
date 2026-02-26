-- Add storage and ram columns to product_variants table
-- This migration adds support for product variants with storage and RAM options (e.g., Samsung S22 Ultra with 256GB/128GB storage and 4GB/6GB RAM)

ALTER TABLE product_variants 
ADD COLUMN IF NOT EXISTS storage VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ram VARCHAR(50) DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_storage_ram ON product_variants(storage, ram);

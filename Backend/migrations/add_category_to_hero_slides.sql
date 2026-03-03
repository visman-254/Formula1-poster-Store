-- Add category_id column to hero_slides table
ALTER TABLE hero_slides ADD COLUMN category_id INT NULL;

-- Add foreign key constraint
ALTER TABLE hero_slides ADD CONSTRAINT fk_hero_slides_category 
FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL;

-- Add index for faster queries
CREATE INDEX idx_hero_slides_category ON hero_slides(category_id);

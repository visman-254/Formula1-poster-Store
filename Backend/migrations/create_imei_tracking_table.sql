-- IMEI Tracking Table Migration
-- Run this SQL to create the imei_tracking table

CREATE TABLE IF NOT EXISTS imei_tracking (
  imei_id INT AUTO_INCREMENT PRIMARY KEY,
  variant_id INT NOT NULL,
  imei_number VARCHAR(50) NOT NULL,
  status ENUM('available', 'reserved', 'used') DEFAULT 'available',
  order_id INT NULL,
  reserved_at TIMESTAMP NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_variant_id (variant_id),
  INDEX idx_imei_number (imei_number),
  INDEX idx_status (status),
  INDEX idx_order_id (order_id),
  
  UNIQUE INDEX idx_imei_unique (imei_number)
);

-- Optional: Add foreign key constraint (uncomment if you want enforced constraints)
-- ALTER TABLE imei_tracking
-- ADD CONSTRAINT fk_imei_variant
-- FOREIGN KEY (variant_id) REFERENCES product_variants(variant_id)
-- ON DELETE CASCADE;

-- Sample query to verify table creation
-- SELECT * FROM imei_tracking LIMIT 10;

-- Migration: Create admin_settings table
-- This table stores admin dashboard settings like wallpaper/background

CREATE TABLE IF NOT EXISTS admin_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default wallpaper setting
INSERT INTO admin_settings (setting_key, setting_value) 
VALUES ('wallpaper', NULL)
ON DUPLICATE KEY UPDATE setting_key = setting_key;

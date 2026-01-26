-- Migration: Add Cashier Role Support
-- Date: 2026-01-26
-- Description: Add cashier role option and POS order tracking columns

-- 1. Add order_type and sales_person_id to orders table
ALTER TABLE `orders` 
ADD COLUMN `order_type` VARCHAR(20) DEFAULT 'online' COMMENT 'Type of order: online or pos' AFTER `paid_for_delivery`,
ADD COLUMN `sales_person_id` INT DEFAULT NULL COMMENT 'User ID of cashier/sales person for POS orders' AFTER `order_type`,
ADD FOREIGN KEY (`sales_person_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

-- 2. Create an index on order_type for faster queries
ALTER TABLE `orders` ADD INDEX `idx_order_type` (`order_type`);

-- 3. Add payment_method to track how POS orders were paid
ALTER TABLE `orders` 
ADD COLUMN `payment_method` VARCHAR(20) DEFAULT NULL COMMENT 'Payment method: cash, mpesa, card' AFTER `sales_person_id`;

-- 4. Add index on sales_person_id for cashier analytics
ALTER TABLE `orders` ADD INDEX `idx_sales_person_id` (`sales_person_id`);

-- Note: Update existing users to add cashier role as needed
-- Example: UPDATE users SET role = 'cashier' WHERE id = X;

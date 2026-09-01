-- Run once against the production database before enabling the toggle.
ALTER TABLE pending_payments ADD COLUMN payment_mode ENUM('test','live') NOT NULL DEFAULT 'test';
ALTER TABLE bookings ADD COLUMN payment_mode ENUM('test','live') NOT NULL DEFAULT 'test';
ALTER TABLE payments ADD COLUMN payment_mode ENUM('test','live') NOT NULL DEFAULT 'test';

CREATE TABLE IF NOT EXISTS payment_settings (
  id TINYINT PRIMARY KEY,
  payment_mode ENUM('test','live') NOT NULL DEFAULT 'test',
  updated_by INT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
INSERT IGNORE INTO payment_settings (id, payment_mode) VALUES (1, 'test');

CREATE TABLE IF NOT EXISTS payment_mode_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  previous_mode ENUM('test','live') NOT NULL,
  next_mode ENUM('test','live') NOT NULL,
  changed_by INT NULL,
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

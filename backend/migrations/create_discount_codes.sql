CREATE TABLE IF NOT EXISTS discount_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  type VARCHAR(16) NOT NULL, -- percent, fixed
  value NUMERIC NOT NULL,
  min_total NUMERIC DEFAULT 0, -- giá trị booking tối thiểu
  max_uses INT DEFAULT 1, -- tổng số lần sử dụng cho mã
  max_uses_per_user INT DEFAULT 1, -- số lần sử dụng cho mỗi user
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(16) DEFAULT 'active', -- active, expired, used, locked
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discount_code_usages (
  id SERIAL PRIMARY KEY,
  discount_code_id INT REFERENCES discount_codes(id),
  user_id INT,
  booking_id INT,
  used_at TIMESTAMP DEFAULT NOW()
);

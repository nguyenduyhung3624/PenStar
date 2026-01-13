-- Migration: 001_initial_schema
-- Description: Initial database schema for PenStar Hotel Management System
-- Created: 2026-01-08

-- =============================================
-- LOOKUP TABLES (No foreign key dependencies)
-- =============================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE, -- admin, receptionist, manager, user...
    description TEXT
);

-- Stay status table
CREATE TABLE IF NOT EXISTS stay_status (
    id SERIAL PRIMARY KEY,
    name VARCHAR(30) UNIQUE NOT NULL,
    description TEXT
);

-- Floors table
CREATE TABLE IF NOT EXISTS floors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Master equipments table
CREATE TABLE IF NOT EXISTS master_equipments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    import_price NUMERIC(15, 2),
    compensation_price NUMERIC(15, 2),
    total_stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    is_included BOOLEAN DEFAULT FALSE,
    image_url VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thumbnail TEXT
);

CREATE INDEX IF NOT EXISTS idx_services_is_included ON services(is_included);

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    type VARCHAR(16) NOT NULL,
    value NUMERIC NOT NULL,
    min_total NUMERIC DEFAULT 0,
    max_uses INTEGER DEFAULT 1,
    max_uses_per_user INTEGER DEFAULT 1,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    status VARCHAR(16) DEFAULT 'active',
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- USER RELATED TABLES
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role_id INTEGER REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    CONSTRAINT users_status_check CHECK (status IN ('active', 'banned'))
);

-- =============================================
-- ROOM RELATED TABLES
-- =============================================

-- Room types table
CREATE TABLE IF NOT EXISTS room_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE, -- Deluxe, Suite, VIP...
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thumbnail VARCHAR(500), -- Ảnh đại diện của loại phòng (URL hoặc path)
    capacity INTEGER DEFAULT 2,
    price NUMERIC(10, 2) DEFAULT 0,
    bed_type VARCHAR(50),
    view_direction VARCHAR(100),
    free_amenities TEXT[],
    room_size NUMERIC,
    base_adults INTEGER DEFAULT 2,
    base_children INTEGER DEFAULT 1,
    extra_adult_fee NUMERIC(10, 2) DEFAULT 0,
    extra_child_fee NUMERIC(10, 2) DEFAULT 0,
    child_age_limit INTEGER DEFAULT 12,
    policies JSONB,
    paid_amenities TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_room_types_bed_type ON room_types(bed_type);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    type_id INTEGER REFERENCES room_types(id),
    status VARCHAR(20) DEFAULT 'available', -- available, maintenance, booked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    thumbnail VARCHAR(255),
    floor_id INTEGER REFERENCES floors(id) ON UPDATE CASCADE ON DELETE SET NULL,
    short_desc TEXT,
    long_desc TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Room images table
CREATE TABLE IF NOT EXISTS room_images (
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    file_hash VARCHAR(64)
);

-- Room type images table
CREATE TABLE IF NOT EXISTS room_type_images (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_hash VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_room_type_images_room_type_id ON room_type_images(room_type_id);

-- Room type equipments table
CREATE TABLE IF NOT EXISTS room_type_equipments (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id),
    equipment_type_id INTEGER NOT NULL REFERENCES master_equipments(id),
    min_quantity INTEGER DEFAULT 1,
    max_quantity INTEGER DEFAULT 1,
    CONSTRAINT unique_room_type_equipment UNIQUE (room_type_id, equipment_type_id)
);

-- Room devices table
CREATE TABLE IF NOT EXISTS room_devices (
    id SERIAL PRIMARY KEY,
    master_equipment_id INTEGER NOT NULL REFERENCES master_equipments(id) ON DELETE RESTRICT,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'working',
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    note TEXT,
    images TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refund policies table
CREATE TABLE IF NOT EXISTS refund_policies (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER NOT NULL REFERENCES room_types(id) ON DELETE CASCADE,
    refundable BOOLEAN NOT NULL DEFAULT FALSE,
    refund_percent INTEGER,
    refund_deadline_hours INTEGER,
    non_refundable BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

-- =============================================
-- BOOKING RELATED TABLES
-- =============================================

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100),
    total_price NUMERIC(10, 2) DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'unpaid',
    booking_method VARCHAR(30) NOT NULL,
    stay_status_id INTEGER REFERENCES stay_status(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_refunded BOOLEAN DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    payment_method VARCHAR(50) DEFAULT NULL, -- Phương thức thanh toán: cash, card, transfer, momo, vnpay, cod
    change_count INTEGER DEFAULT 0, -- Số lần đã đổi phòng (tối đa 1 lần)
    checked_in_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    checked_out_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cancel_reason TEXT,
    canceled_by INTEGER REFERENCES users(id),
    canceled_at TIMESTAMP,
    discount_code VARCHAR(32),
    discount_amount NUMERIC DEFAULT 0,
    refund_amount INTEGER DEFAULT 0,
    CONSTRAINT check_change_count_limit CHECK (change_count <= 1)
);

-- Booking items table
CREATE TABLE IF NOT EXISTS booking_items (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id),
    check_in TIMESTAMP NOT NULL,
    check_out TIMESTAMP NOT NULL,
    num_adults INTEGER DEFAULT 1,
    num_children INTEGER DEFAULT 0,
    special_requests TEXT,
    room_type_id INTEGER,
    room_type_price NUMERIC,
    quantity INTEGER DEFAULT 1,
    extra_adult_fees NUMERIC DEFAULT 0,
    extra_child_fees NUMERIC DEFAULT 0,
    extra_fees NUMERIC DEFAULT 0,
    num_babies INTEGER DEFAULT 0,
    refund_amount INTEGER DEFAULT 0
);

-- Booking services table
CREATE TABLE IF NOT EXISTS booking_services (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id),
    quantity INTEGER DEFAULT 1,
    total_service_price NUMERIC(10, 2) NOT NULL,
    booking_item_id INTEGER REFERENCES booking_items(id),
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    note TEXT
);

-- Booking service logs table
CREATE TABLE IF NOT EXISTS booking_service_logs (
    id SERIAL PRIMARY KEY,
    booking_service_id INTEGER REFERENCES booking_services(id) ON DELETE CASCADE,
    action VARCHAR(20),
    action_by INTEGER,
    action_at TIMESTAMP DEFAULT NOW(),
    note TEXT
);

-- Booking incidents table
CREATE TABLE IF NOT EXISTS booking_incidents (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    room_id INTEGER,
    equipment_id INTEGER REFERENCES master_equipments(id),
    quantity INTEGER NOT NULL,
    reason TEXT,
    amount NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    compensation_price NUMERIC,
    deleted_at TIMESTAMP,
    deleted_by INTEGER,
    deleted_reason TEXT
);

-- Booking bill logs table
CREATE TABLE IF NOT EXISTS booking_bill_logs (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id),
    user_id INTEGER,
    printed_at TIMESTAMP DEFAULT NOW(),
    bill_number TEXT,
    note TEXT
);

-- =============================================
-- LOGGING & TRACKING TABLES
-- =============================================

-- Equipment stock logs table
CREATE TABLE IF NOT EXISTS equipment_stock_logs (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER NOT NULL REFERENCES master_equipments(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    from_room_id INTEGER,
    to_room_id INTEGER,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    action VARCHAR(20)
);

-- Discount code usages table
CREATE TABLE IF NOT EXISTS discount_code_usages (
    id SERIAL PRIMARY KEY,
    discount_code_id INTEGER REFERENCES discount_codes(id),
    user_id INTEGER,
    booking_id INTEGER,
    used_at TIMESTAMP DEFAULT NOW()
);

-- =============================================
-- SEED DATA
-- =============================================

-- Insert default roles
INSERT INTO roles (name, description) VALUES
    ('admin', 'Quản trị viên hệ thống'),
    ('manager', 'Quản lý khách sạn'),
    ('receptionist', 'Nhân viên lễ tân'),
    ('user', 'Khách hàng')
ON CONFLICT (name) DO NOTHING;

-- Insert default stay statuses
INSERT INTO stay_status (name, description) VALUES
    ('pending', 'Đang chờ xác nhận'),
    ('confirmed', 'Đã xác nhận'),
    ('checked_in', 'Đã nhận phòng'),
    ('checked_out', 'Đã trả phòng'),
    ('cancelled', 'Đã hủy'),
    ('no_show', 'Không đến')
ON CONFLICT (name) DO NOTHING;

-- Insert default floors
INSERT INTO floors (name, description) VALUES
    ('Tầng 1', 'Tầng trệt'),
    ('Tầng 2', 'Tầng 2'),
    ('Tầng 3', 'Tầng 3'),
    ('Tầng 4', 'Tầng 4'),
    ('Tầng 5', 'Tầng 5')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE roles IS 'Bảng các vai trò người dùng';
COMMENT ON TABLE users IS 'Bảng người dùng hệ thống';
COMMENT ON TABLE room_types IS 'Bảng loại phòng';
COMMENT ON TABLE rooms IS 'Bảng phòng';
COMMENT ON TABLE bookings IS 'Bảng đặt phòng';
COMMENT ON TABLE services IS 'Bảng dịch vụ';

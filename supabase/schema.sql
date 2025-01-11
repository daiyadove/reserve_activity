-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON customers;
DROP POLICY IF EXISTS "Enable insert access for all users" ON customers;
DROP POLICY IF EXISTS "Enable read access for all users" ON time_slots;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON time_slots;
DROP POLICY IF EXISTS "Enable read access for all users" ON reservations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON reservations;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable read access for all users" ON sold_out_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sold_out_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sold_out_settings;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sold_out_settings;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON system_logs;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON system_logs;

-- Drop existing tables
DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS sold_out_settings;
DROP TABLE IF EXISTS time_slots;
DROP TABLE IF EXISTS customers;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable full text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT
);

-- Create index for customer name search
CREATE INDEX IF NOT EXISTS customers_name_trgm_idx ON customers USING GIN (name gin_trgm_ops);

-- Time slots table (時間枠のみを管理)
CREATE TABLE IF NOT EXISTS time_slots (
    slot_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(start_time, end_time)
);

-- Sold out settings table (特定の日付の売止を管理)
CREATE TABLE IF NOT EXISTS sold_out_settings (
    sold_out_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slot_id UUID NOT NULL REFERENCES time_slots(slot_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(slot_id, date)
);

-- Create index for sold out date lookup
CREATE INDEX IF NOT EXISTS sold_out_settings_date_idx ON sold_out_settings (date);

-- Reservations table
CREATE TABLE IF NOT EXISTS reservations (
    reservation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    slot_id UUID NOT NULL REFERENCES time_slots(slot_id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    number_of_people INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for reservation lookups
CREATE INDEX IF NOT EXISTS reservations_customer_id_idx ON reservations (customer_id);
CREATE INDEX IF NOT EXISTS reservations_slot_id_idx ON reservations (slot_id);
CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations (reservation_date);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_level TEXT NOT NULL,
    log_message TEXT NOT NULL,
    log_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for log time
CREATE INDEX IF NOT EXISTS system_logs_time_idx ON system_logs (log_time);

-- Enable Row Level Security (RLS)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sold_out_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Enable read access for all users" ON customers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON customers FOR INSERT WITH CHECK (true);

-- Create policies for time_slots
CREATE POLICY "Enable read access for all users" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON time_slots FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for reservations
CREATE POLICY "Enable read access for all users" ON reservations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable delete access for authenticated users" ON reservations FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for sold_out_settings
CREATE POLICY "Enable read access for all users" ON sold_out_settings FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON sold_out_settings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON sold_out_settings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON sold_out_settings FOR DELETE USING (auth.role() = 'authenticated');

-- Create policies for system_logs
CREATE POLICY "Enable read access for authenticated users" ON system_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert access for authenticated users" ON system_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
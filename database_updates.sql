-- Database Updates for Smart Garage CRM
-- Run these commands in your Supabase SQL editor

-- 1. Rename 'Description' column to 'Parts Sold' in all_jobs table
ALTER TABLE all_jobs RENAME COLUMN "Description" TO "Parts Sold";

-- 2. Create supplies table for inventory management
CREATE TABLE IF NOT EXISTS supplies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    part_number VARCHAR(100),
    description TEXT,
    tech_price DECIMAL(10,2) NOT NULL, -- Price technicians see
    purchase_price DECIMAL(10,2) NOT NULL, -- Price we purchased it for
    markup_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN purchase_price > 0 THEN 
                ROUND(((tech_price - purchase_price) / purchase_price) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    stock_quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    supplier VARCHAR(255),
    supplier_contact VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_supplies_category ON supplies(category);
CREATE INDEX IF NOT EXISTS idx_supplies_name ON supplies(name);
CREATE INDEX IF NOT EXISTS idx_supplies_part_number ON supplies(part_number);
CREATE INDEX IF NOT EXISTS idx_supplies_active ON supplies(is_active);

-- 4. Insert sample supplies data
INSERT INTO supplies (name, category, part_number, description, tech_price, purchase_price, stock_quantity, supplier) VALUES
-- Garage Door Springs
('Extension Spring 28"', 'Springs', 'ES-28-150', '28 inch extension spring, 150 lb capacity', 45.00, 28.50, 10, 'Garage Door Supply Co'),
('Extension Spring 30"', 'Springs', 'ES-30-175', '30 inch extension spring, 175 lb capacity', 52.00, 32.80, 8, 'Garage Door Supply Co'),
('Torsion Spring 0.225"', 'Springs', 'TS-225-7', '0.225 inch torsion spring, 7 turns', 38.00, 24.20, 15, 'Garage Door Supply Co'),

-- Garage Door Openers
('Chain Drive Opener', 'Openers', 'CD-8500', '1/2 HP chain drive garage door opener', 180.00, 115.00, 5, 'LiftMaster'),
('Belt Drive Opener', 'Openers', 'BD-8500', '1/2 HP belt drive garage door opener', 220.00, 140.00, 3, 'LiftMaster'),
('Wall Mount Opener', 'Openers', 'WM-8500', 'Wall mount garage door opener', 320.00, 205.00, 2, 'LiftMaster'),

-- Hardware & Accessories
('Garage Door Roller', 'Hardware', 'GR-10', '10 ball bearing garage door roller', 8.50, 5.20, 50, 'Hardware Supply'),
('Garage Door Cable', 'Hardware', 'GDC-12', '12 foot garage door cable', 12.00, 7.50, 25, 'Hardware Supply'),
('Garage Door Bracket', 'Hardware', 'GDB-UNI', 'Universal garage door bracket', 15.00, 9.80, 30, 'Hardware Supply'),

-- Weather Stripping
('Bottom Seal 16ft', 'Weather Stripping', 'BS-16', '16 foot bottom weather seal', 25.00, 16.50, 20, 'Weather Pro'),
('Side Seal 8ft', 'Weather Stripping', 'SS-8', '8 foot side weather seal', 18.00, 11.80, 15, 'Weather Pro'),

-- Safety & Security
('Safety Sensor Kit', 'Safety', 'SSK-2', 'Pair of safety sensors', 45.00, 28.90, 12, 'Safety First'),
('Keypad Entry', 'Security', 'KE-877', 'Wireless keypad entry system', 65.00, 42.00, 8, 'Security Plus'),

-- Tools & Equipment
('Spring Tension Tool', 'Tools', 'STT-PRO', 'Professional spring tension tool', 85.00, 55.00, 3, 'Tool Master'),
('Garage Door Tester', 'Tools', 'GDT-100', 'Garage door opener tester', 35.00, 22.50, 5, 'Tool Master');

-- 5. Create a view for supplies with markup information
CREATE OR REPLACE VIEW supplies_with_markup AS
SELECT 
    id,
    name,
    category,
    part_number,
    description,
    tech_price,
    purchase_price,
    markup_percentage,
    ROUND(tech_price - purchase_price, 2) AS markup_amount,
    stock_quantity,
    min_stock_level,
    CASE 
        WHEN stock_quantity <= min_stock_level THEN 'Low Stock'
        WHEN stock_quantity = 0 THEN 'Out of Stock'
        ELSE 'In Stock'
    END AS stock_status,
    supplier,
    supplier_contact,
    notes,
    is_active,
    created_at,
    updated_at
FROM supplies
WHERE is_active = true;

-- 6. Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger to automatically update updated_at
CREATE TRIGGER update_supplies_updated_at 
    BEFORE UPDATE ON supplies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Create RLS (Row Level Security) policies if needed
-- ALTER TABLE supplies ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Supplies are viewable by everyone" ON supplies FOR SELECT USING (true);
-- CREATE POLICY "Supplies are manageable by authenticated users" ON supplies FOR ALL USING (auth.role() = 'authenticated');

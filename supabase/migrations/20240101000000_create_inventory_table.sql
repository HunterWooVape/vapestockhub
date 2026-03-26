-- Create an enum for inventory status
CREATE TYPE inventory_status AS ENUM ('active', 'reserved', 'sold', 'expired');

-- Create an enum for contact visibility
CREATE TYPE contact_visibility AS ENUM ('public', 'contact_required');

-- Create the main inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    
    -- Product Details
    title TEXT NOT NULL,
    brand TEXT NOT NULL,
    product_type TEXT NOT NULL,
    
    -- Specifications
    puff INTEGER,
    e_liquid TEXT,
    nicotine TEXT,
    flavor TEXT,
    
    -- Trading Details
    price DECIMAL(10, 2) NOT NULL, -- Stored as USD
    quantity INTEGER NOT NULL,
    moq INTEGER DEFAULT 1,
    
    -- Location & Market (MVP uses TEXT for flexibility)
    market TEXT NOT NULL,
    warehouse_location TEXT NOT NULL,
    
    -- Media & Content
    description TEXT,
    images TEXT[] DEFAULT '{}',
    
    -- Control & Status
    status inventory_status DEFAULT 'active'::inventory_status,
    contact_visibility contact_visibility DEFAULT 'contact_required'::contact_visibility,
    is_featured BOOLEAN DEFAULT false,
    is_urgent_clearance BOOLEAN DEFAULT false,
    
    -- SLA & Timestamps
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function before update
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for common query patterns
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_brand ON inventory(brand);
CREATE INDEX idx_inventory_market ON inventory(market);
CREATE INDEX idx_inventory_warehouse ON inventory(warehouse_location);
CREATE INDEX idx_inventory_price ON inventory(price);

-- Enable RLS and create public read policy
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" 
    ON inventory FOR SELECT 
    USING (true);

-- ==========================================
-- SEED DATA (MOCK DATA FOR LOCAL DEVELOPMENT)
-- ==========================================

INSERT INTO inventory (
    slug, title, brand, product_type, puff, e_liquid, nicotine, flavor, 
    price, quantity, moq, market, warehouse_location, images, status, contact_visibility, is_featured, is_urgent_clearance
) VALUES 
(
    'vozol-star-10000-dubai-clearance', 
    'Vozol Star 10000 Disposable Vape', 
    'Vozol', 
    'Disposable', 
    10000, 
    '16ml', 
    '5%', 
    'Mixed Flavors', 
    3.20, 
    5000, 
    500, 
    'Middle East', 
    'Dubai, UAE', 
    ARRAY['https://placehold.co/600x400/111827/22C7A9?text=Vozol+Star+10000'], 
    'active', 
    'public',
    true,
    true
),
(
    'elfbar-bc5000-latam-stock', 
    'Elf Bar BC5000 Rechargeable', 
    'Elf Bar', 
    'Disposable', 
    5000, 
    '13ml', 
    '5%', 
    'Watermelon Ice', 
    2.80, 
    12000, 
    1000, 
    'Latin America', 
    'Miami, USA (Transit)', 
    ARRAY['https://placehold.co/600x400/111827/22C7A9?text=Elf+Bar+BC5000'], 
    'active', 
    'contact_required',
    false,
    false
),
(
    'geekbar-pulse-15000-europe', 
    'Geek Bar Pulse 15000', 
    'Geek Bar', 
    'Disposable', 
    15000, 
    '16ml', 
    '2%', 
    'Blue Razz Ice', 
    4.50, 
    3000, 
    200, 
    'Eastern Europe', 
    'Warsaw, Serbia', 
    ARRAY['https://placehold.co/600x400/111827/22C7A9?text=Geek+Bar+Pulse'], 
    'active', 
    'public',
    true,
    false
);

CREATE TYPE supplier_submission_status AS ENUM ('new', 'reviewing', 'converted', 'rejected');

CREATE TABLE IF NOT EXISTS supplier_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    supplier_name TEXT NOT NULL,
    contact_name TEXT,
    contact_channel TEXT,
    source_type TEXT NOT NULL DEFAULT 'supplier_form',
    brand TEXT NOT NULL,
    model_name TEXT NOT NULL,
    product_type TEXT NOT NULL,
    unit_price_text TEXT,
    available_qty_text TEXT NOT NULL,
    moq_text TEXT,
    target_market TEXT NOT NULL,
    warehouse_location TEXT NOT NULL,
    puff_text TEXT,
    nicotine_text TEXT,
    e_liquid_text TEXT,
    flavor_list TEXT,
    flavor_breakdown TEXT,
    image_links TEXT,
    stock_notes TEXT,
    packaging_notes TEXT,
    extra_notes TEXT,
    raw_text_snapshot TEXT NOT NULL,
    submission_status supplier_submission_status NOT NULL DEFAULT 'new'::supplier_submission_status,
    internal_notes TEXT,
    ai_draft_package JSONB,
    converted_inventory_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_supplier_submissions_status ON supplier_submissions(submission_status);
CREATE INDEX idx_supplier_submissions_created_at ON supplier_submissions(created_at DESC);
CREATE INDEX idx_supplier_submissions_brand ON supplier_submissions(brand);
CREATE INDEX idx_supplier_submissions_supplier_name ON supplier_submissions(supplier_name);

ALTER TABLE supplier_submissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_supplier_submissions_updated_at
    BEFORE UPDATE ON supplier_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

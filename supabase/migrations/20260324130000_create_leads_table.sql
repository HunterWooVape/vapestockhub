CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_page_type TEXT NOT NULL,
    source_page_slug TEXT NOT NULL,
    source_channel TEXT NOT NULL,
    item_slug TEXT,
    lead_status TEXT NOT NULL DEFAULT 'new',
    target_url TEXT,
    referer TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source_page_type ON leads(source_page_type);
CREATE INDEX IF NOT EXISTS idx_leads_source_channel ON leads(source_channel);
CREATE INDEX IF NOT EXISTS idx_leads_item_slug ON leads(item_slug);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable lead insert for all users"
    ON leads FOR INSERT
    WITH CHECK (true);

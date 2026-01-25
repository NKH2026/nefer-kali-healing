-- Site Settings Schema
-- This table stores site-wide settings like vacation mode

CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the key column for fast lookups
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(key);

-- Insert default vacation mode settings
INSERT INTO site_settings (key, value)
VALUES (
    'vacation_mode',
    '{"enabled": false, "message": ""}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to read settings (for frontend)
CREATE POLICY "Allow public read access to site_settings"
ON site_settings FOR SELECT
USING (true);

-- Policy: Allow authenticated users to update settings (for admin)
CREATE POLICY "Allow authenticated users to update site_settings"
ON site_settings FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert settings (for admin)
CREATE POLICY "Allow authenticated users to insert site_settings"
ON site_settings FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function on update
DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
    BEFORE UPDATE ON site_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_site_settings_updated_at();

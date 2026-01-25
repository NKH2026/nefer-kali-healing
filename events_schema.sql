-- Events Management System Schema
-- Run this in your Supabase SQL Editor

-- =============================================
-- EVENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'workshop' CHECK (event_type IN ('workshop', 'ceremony', 'circle', 'retreat', 'other')),
    location_type TEXT DEFAULT 'virtual' CHECK (location_type IN ('virtual', 'in-person', 'hybrid')),
    location_details TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    cover_image_url TEXT,
    max_capacity INTEGER,
    ticket_price DECIMAL(10,2) DEFAULT 0,
    is_free BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for events
CREATE POLICY "Anyone can view published events" ON events
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authenticated users can manage events" ON events
    FOR ALL USING (auth.role() = 'authenticated');


-- =============================================
-- EVENT REGISTRATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    ticket_code TEXT UNIQUE DEFAULT (
        'NKH-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 8))
    ),
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    ticket_sent_at TIMESTAMPTZ,
    
    -- Prevent duplicate registrations for same event
    UNIQUE(event_id, email)
);

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies for registrations
CREATE POLICY "Anyone can create registrations" ON event_registrations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own registrations" ON event_registrations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage all registrations" ON event_registrations
    FOR ALL USING (auth.role() = 'authenticated');


-- =============================================
-- HELPER FUNCTION: Get registration count for event
-- =============================================
CREATE OR REPLACE FUNCTION get_event_registration_count(event_uuid UUID)
RETURNS INTEGER AS $$
    SELECT COUNT(*)::INTEGER 
    FROM event_registrations 
    WHERE event_id = event_uuid AND status = 'confirmed';
$$ LANGUAGE SQL STABLE;


-- =============================================
-- TRIGGER: Update updated_at on events
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- =============================================
-- INDEXES for better performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_email ON event_registrations(email);


-- =============================================
-- NOTE: Database webhook for automated emails
-- =============================================
-- After creating these tables, you'll need to set up a Database Webhook
-- in Supabase Dashboard > Database > Webhooks that triggers on INSERT
-- to event_registrations and calls your Edge Function.
-- We'll set this up after creating the Edge Function.

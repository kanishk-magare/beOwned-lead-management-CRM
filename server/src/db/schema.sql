-- beOwned CRM schema (idempotent: safe to run multiple times)

CREATE TABLE IF NOT EXISTS leads (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100)   NOT NULL,
  phone          VARCHAR(15)    NOT NULL,
  email          VARCHAR(255)   NOT NULL,
  budget         NUMERIC(14, 2) NOT NULL CHECK (budget >= 0),
  location       VARCHAR(150)   NOT NULL,
  property_type  VARCHAR(20)    NOT NULL
                 CHECK (property_type IN ('1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Villa', 'Plot', 'Commercial')),
  source         VARCHAR(20)    NOT NULL
                 CHECK (source IN ('Facebook', 'Google', 'Instagram', 'Referral', 'Website', 'Walk-in', 'Other')),
  status         VARCHAR(20)    NOT NULL DEFAULT 'New'
                 CHECK (status IN ('New', 'Contacted', 'Site Visit', 'Closed')),
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT leads_phone_unique UNIQUE (phone),
  CONSTRAINT leads_email_unique UNIQUE (email)
);

-- Ensure leads_email_unique constraint exists on already-created tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'leads_email_unique'
  ) THEN
    ALTER TABLE leads ADD CONSTRAINT leads_email_unique UNIQUE (email);
  END IF;
END $$;

-- Ensure location column can store complete address strings
ALTER TABLE leads ALTER COLUMN location TYPE VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_source      ON leads (source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_budget      ON leads (budget);
CREATE INDEX IF NOT EXISTS idx_leads_name_lower  ON leads (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_leads_email_lower ON leads (LOWER(email));

CREATE TABLE IF NOT EXISTS lead_notes (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER     NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  content     TEXT        NOT NULL CHECK (char_length(content) > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes (lead_id, created_at DESC);

-- Keep updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leads_updated_at ON leads;
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

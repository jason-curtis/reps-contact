-- Representatives table
CREATE TABLE IF NOT EXISTS representatives (
  bioguide_id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('sen', 'rep')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  party TEXT NOT NULL,
  state TEXT NOT NULL,
  district INTEGER, -- NULL for senators
  phone TEXT,
  url TEXT,
  contact_form TEXT,
  photo_url TEXT,
  office TEXT,
  start_date TEXT,
  end_date TEXT
);

-- State lookup index
CREATE INDEX IF NOT EXISTS idx_reps_state ON representatives(state);

-- District lookup index
CREATE INDEX IF NOT EXISTS idx_reps_state_district ON representatives(state, district);

-- Zip-to-district mapping table (from Census/HUD data)
CREATE TABLE IF NOT EXISTS zip_districts (
  zip TEXT NOT NULL,
  state TEXT NOT NULL,
  district INTEGER NOT NULL,
  ratio REAL DEFAULT 1.0, -- population ratio for split zips
  PRIMARY KEY (zip, state, district)
);

CREATE INDEX IF NOT EXISTS idx_zip ON zip_districts(zip);

-- Naturelover — SQLite schema (Trefle.io catalog)

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  image_url TEXT,

  trefle_id INTEGER NOT NULL,
  trefle_slug TEXT NOT NULL UNIQUE,
  family TEXT,
  genus TEXT,
  edible_part TEXT,
  vegetable INTEGER NOT NULL DEFAULT 0,
  observations TEXT,
  synonyms TEXT NOT NULL DEFAULT '[]',
  trefle_json TEXT,

  category TEXT NOT NULL,
  canopy_layer TEXT NOT NULL,
  guild_functions TEXT NOT NULL,
  is_florida_native INTEGER NOT NULL DEFAULT 0,
  is_kitchen_essential INTEGER NOT NULL DEFAULT 0,
  is_edible INTEGER NOT NULL DEFAULT 0,
  florida_hardiness_zones TEXT NOT NULL,
  native_states TEXT NOT NULL DEFAULT '[]',
  grows_in_us INTEGER NOT NULL DEFAULT 0,
  is_invasive_in_florida INTEGER NOT NULL DEFAULT 0,
  mature_height_min REAL NOT NULL,
  mature_height_max REAL NOT NULL,
  mature_spread_min REAL NOT NULL,
  mature_spread_max REAL NOT NULL,
  canvas_radius_feet REAL NOT NULL,
  sunlight TEXT NOT NULL,
  water_needs TEXT NOT NULL,
  soil_preferences TEXT NOT NULL,
  best_planting_seasons TEXT NOT NULL,
  growth_rate TEXT NOT NULL,
  care_summary TEXT NOT NULL,
  uses TEXT NOT NULL,
  benefits TEXT NOT NULL,
  companion_plants TEXT NOT NULL,
  avoid_planting_near TEXT NOT NULL,
  tags TEXT NOT NULL,
  data_source TEXT NOT NULL,
  last_updated TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_plants_category ON plants(category);
CREATE INDEX IF NOT EXISTS idx_plants_canopy_layer ON plants(canopy_layer);
CREATE INDEX IF NOT EXISTS idx_plants_florida_native ON plants(is_florida_native);
CREATE INDEX IF NOT EXISTS idx_plants_kitchen_essential ON plants(is_kitchen_essential);
CREATE INDEX IF NOT EXISTS idx_plants_edible ON plants(is_edible);
CREATE INDEX IF NOT EXISTS idx_plants_trefle_slug ON plants(trefle_slug);
CREATE INDEX IF NOT EXISTS idx_plants_trefle_id ON plants(trefle_id);

-- Naturelover — PostgreSQL schema (Supabase)

CREATE TABLE IF NOT EXISTS plants (
  id TEXT PRIMARY KEY,
  common_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  image_url TEXT,

  trefle_id INTEGER NOT NULL DEFAULT 0,
  trefle_slug TEXT NOT NULL UNIQUE,
  family TEXT,
  genus TEXT,
  edible_part TEXT,
  vegetable BOOLEAN NOT NULL DEFAULT false,
  observations TEXT,
  synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  trefle_json TEXT,

  category TEXT NOT NULL,
  canopy_layer TEXT NOT NULL,
  guild_functions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_florida_native BOOLEAN NOT NULL DEFAULT false,
  is_kitchen_essential BOOLEAN NOT NULL DEFAULT false,
  is_edible BOOLEAN NOT NULL DEFAULT false,
  florida_hardiness_zones JSONB NOT NULL DEFAULT '[]'::jsonb,
  native_states JSONB NOT NULL DEFAULT '[]'::jsonb,
  grows_in_us BOOLEAN NOT NULL DEFAULT false,
  is_invasive_in_florida BOOLEAN NOT NULL DEFAULT false,
  mature_height_min DOUBLE PRECISION NOT NULL,
  mature_height_max DOUBLE PRECISION NOT NULL,
  mature_spread_min DOUBLE PRECISION NOT NULL,
  mature_spread_max DOUBLE PRECISION NOT NULL,
  canvas_radius_feet DOUBLE PRECISION NOT NULL,
  sunlight TEXT NOT NULL,
  water_needs TEXT NOT NULL,
  soil_preferences JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_planting_seasons JSONB NOT NULL DEFAULT '[]'::jsonb,
  growth_rate TEXT NOT NULL,
  care_summary TEXT NOT NULL DEFAULT '',
  uses JSONB NOT NULL DEFAULT '[]'::jsonb,
  benefits JSONB NOT NULL DEFAULT '[]'::jsonb,
  companion_plants JSONB NOT NULL DEFAULT '[]'::jsonb,
  avoid_planting_near JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
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
CREATE INDEX IF NOT EXISTS idx_plants_grows_in_us ON plants(grows_in_us);
CREATE INDEX IF NOT EXISTS idx_plants_common_name ON plants(LOWER(common_name));

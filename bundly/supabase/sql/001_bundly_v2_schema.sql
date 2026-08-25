-- ══════════════════════════════════════════════════════════════════════════════
-- Bundly v2 — Schéma complet avec gamification
-- Exécuter dans l'ordre dans le SQL Editor Supabase
-- ══════════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ── Couples & Profiles ────────────────────────────────────────────────────────

CREATE TABLE couples (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_code TEXT UNIQUE NOT NULL,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  couple_id   UUID REFERENCES couples(id),
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Gamification ──────────────────────────────────────────────────────────────

CREATE TABLE couple_xp (
  couple_id    UUID PRIMARY KEY REFERENCES couples(id) ON DELETE CASCADE,
  total_xp     INT NOT NULL DEFAULT 0,
  weekly_xp    INT NOT NULL DEFAULT 0,
  streak_days  INT NOT NULL DEFAULT 0,
  last_active  DATE,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE xp_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   UUID REFERENCES couples(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES profiles(id),
  module      TEXT NOT NULL,
  action      TEXT NOT NULL,
  xp_earned   INT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction pour incrémenter les XP + streak
CREATE OR REPLACE FUNCTION increment_couple_xp(p_couple_id UUID, p_xp INT)
RETURNS VOID AS $$
DECLARE
  v_last_active DATE;
  v_today DATE := CURRENT_DATE;
  v_streak INT;
BEGIN
  SELECT last_active, streak_days INTO v_last_active, v_streak
  FROM couple_xp WHERE couple_id = p_couple_id;

  -- Update streak
  IF v_last_active = v_today - 1 THEN
    v_streak := v_streak + 1;
  ELSIF v_last_active < v_today - 1 OR v_last_active IS NULL THEN
    v_streak := 1;
  END IF;

  UPDATE couple_xp SET
    total_xp    = total_xp + p_xp,
    weekly_xp   = weekly_xp + p_xp,
    streak_days = v_streak,
    last_active = v_today,
    updated_at  = NOW()
  WHERE couple_id = p_couple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset weekly XP chaque lundi (pg_cron)
SELECT cron.schedule('reset-weekly-xp', '0 0 * * 1',
  'UPDATE couple_xp SET weekly_xp = 0'
);

-- ── Modules ───────────────────────────────────────────────────────────────────

-- Tâches
CREATE TABLE tasks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id         UUID REFERENCES couples(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT,
  priority          TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  assigned_to       UUID REFERENCES profiles(id),
  routine           BOOLEAN DEFAULT FALSE,
  routine_frequency TEXT,
  completed         BOOLEAN DEFAULT FALSE,
  completed_at      TIMESTAMPTZ,
  due_date          DATE,
  created_by        UUID REFERENCES profiles(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Rendez-vous
CREATE TABLE appointments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id   UUID REFERENCES couples(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ,
  location    TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Courses
CREATE TABLE shopping_lists (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  title     TEXT NOT NULL DEFAULT 'Liste de courses',
  active    BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shopping_items (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id    UUID REFERENCES shopping_lists(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  category   TEXT,
  picked     BOOLEAN DEFAULT FALSE,
  added_by   UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Émotions
CREATE TABLE emotions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  emotion    TEXT NOT NULL,
  mood       INT CHECK (mood BETWEEN 1 AND 10),
  context    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emotion_debriefs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emotion_id  UUID REFERENCES emotions(id) ON DELETE CASCADE,
  debrief     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Menstruations
CREATE TABLE menstruation_periods (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  start_date   DATE NOT NULL,
  end_date     DATE,
  cycle_length INT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE menstruation_symptoms (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_id    UUID REFERENCES menstruation_periods(id) ON DELETE CASCADE,
  symptom_type TEXT NOT NULL,
  severity     INT CHECK (severity BETWEEN 1 AND 5),
  recorded_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Animaux
CREATE TABLE pets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id  UUID REFERENCES couples(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  type       TEXT,
  breed      TEXT,
  birth_date DATE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE pet_vaccinations (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id    UUID REFERENCES pets(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  date      DATE,
  next_date DATE
);

CREATE TABLE pet_weight (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id      UUID REFERENCES pets(id) ON DELETE CASCADE,
  weight      DECIMAL NOT NULL,
  recorded_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE pet_vet_visits (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id     UUID REFERENCES pets(id) ON DELETE CASCADE,
  reason     TEXT,
  visited_at DATE,
  next_visit DATE
);

-- Traitements
CREATE TABLE treatments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  dosage        TEXT,
  frequency     TEXT,
  reminder_time TIME,
  stock         INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE treatment_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  taken_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness
CREATE TABLE fitness_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity   TEXT NOT NULL,
  duration   INT,
  calories   INT,
  notes      TEXT,
  logged_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Anti-gaspillage
CREATE TABLE food_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id        UUID REFERENCES couples(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  expiry_date      DATE,
  storage_location TEXT,
  status           TEXT CHECK (status IN ('ok', 'warning', 'expired', 'consumed')) DEFAULT 'ok',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Photos
CREATE TABLE photos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id    UUID REFERENCES couples(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption      TEXT,
  uploaded_by  UUID REFERENCES profiles(id),
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Dates importantes
CREATE TABLE important_dates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id     UUID REFERENCES couples(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  date          DATE NOT NULL,
  reminder_days INT DEFAULT 3,
  recurring     BOOLEAN DEFAULT TRUE
);

-- Abonnements
CREATE TABLE subscriptions (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id    UUID REFERENCES couples(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  renewal_date DATE,
  amount       DECIMAL,
  category     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Véhicules
CREATE TABLE vehicles (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id       UUID REFERENCES couples(id) ON DELETE CASCADE,
  make            TEXT NOT NULL,
  model           TEXT,
  year            INT,
  plate           TEXT,
  mileage         INT,
  next_service    DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE couples              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE couple_xp            ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists       ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_debriefs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE menstruation_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE menstruation_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vaccinations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_weight           ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_vet_visits       ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fitness_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items           ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE important_dates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles             ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION my_couple_id()
RETURNS UUID AS $$
  SELECT couple_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Policies par couple (pattern identique pour toutes les tables couple_id)
CREATE POLICY "couple_access" ON tasks
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON appointments
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON shopping_lists
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON couple_xp
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON xp_events
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON pets
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON food_items
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON photos
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON important_dates
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON subscriptions
  USING (couple_id = my_couple_id());

CREATE POLICY "couple_access" ON vehicles
  USING (couple_id = my_couple_id());

-- Policies par profil
CREATE POLICY "own_profile" ON emotions
  USING (profile_id = auth.uid());

CREATE POLICY "own_profile" ON menstruation_periods
  USING (profile_id = auth.uid());

CREATE POLICY "own_profile" ON treatments
  USING (profile_id = auth.uid());

CREATE POLICY "own_profile" ON fitness_logs
  USING (profile_id = auth.uid());

-- Profiles : lecture du couple entier
CREATE POLICY "couple_profiles" ON profiles
  USING (couple_id = my_couple_id() OR id = auth.uid());

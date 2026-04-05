-- ============================================================
-- Pet Health App — Initial Schema for Neon (plain Postgres)
-- No Supabase-specific extensions required.
-- Authorization is enforced at the application layer:
--   every query filters by owner_id = <clerk_user_id>
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- Mirrors Clerk user IDs; populated on first sign-in via
-- the syncProfile() call in RootNavigator.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          TEXT PRIMARY KEY,          -- Clerk user ID (e.g. user_2abc...)
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: pets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  species     TEXT NOT NULL,
  breed       TEXT,
  birthdate   DATE,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: weight_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  weight_kg   NUMERIC(6,3) NOT NULL,
  logged_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: health_records
-- ============================================================
CREATE TYPE IF NOT EXISTS public.health_record_type AS ENUM
  ('vaccine', 'consultation', 'exam', 'surgery', 'other');

CREATE TABLE IF NOT EXISTS public.health_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id          UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  record_type     public.health_record_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  veterinarian    TEXT,
  record_date     DATE NOT NULL,
  attachment_urls TEXT[],
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: vets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  clinic      TEXT,
  phone       TEXT,
  email       TEXT,
  specialty   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: appointments
-- ============================================================
CREATE TYPE IF NOT EXISTS public.appointment_status AS ENUM
  ('scheduled', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS public.appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id          UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id          UUID REFERENCES public.vets(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  appointment_at  TIMESTAMPTZ NOT NULL,
  status          public.appointment_status NOT NULL DEFAULT 'scheduled',
  location        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: reminders
-- ============================================================
CREATE TYPE IF NOT EXISTS public.reminder_type AS ENUM
  ('vaccine', 'consultation', 'medication', 'exam', 'other');

CREATE TABLE IF NOT EXISTS public.reminders (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id              TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pet_id                UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  description           TEXT,
  reminder_type         public.reminder_type NOT NULL,
  remind_at             TIMESTAMPTZ NOT NULL,
  is_recurring          BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_days       INTEGER,
  expo_push_token       TEXT,
  local_notification_id TEXT,
  is_completed          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: pet_vets (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pet_vets (
  pet_id   UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id   UUID NOT NULL REFERENCES public.vets(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (pet_id, vet_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pets_owner            ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_health_records_pet    ON public.health_records(pet_id);
CREATE INDEX IF NOT EXISTS idx_health_records_owner  ON public.health_records(owner_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_pet       ON public.weight_logs(pet_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_date      ON public.weight_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_reminders_owner       ON public.reminders(owner_id);
CREATE INDEX IF NOT EXISTS idx_reminders_remind_at   ON public.reminders(remind_at);
CREATE INDEX IF NOT EXISTS idx_appointments_owner    ON public.appointments(owner_id);
CREATE INDEX IF NOT EXISTS idx_appointments_at       ON public.appointments(appointment_at);
CREATE INDEX IF NOT EXISTS idx_appointments_pet      ON public.appointments(pet_id);

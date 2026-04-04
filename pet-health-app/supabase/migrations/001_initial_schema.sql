-- ============================================================
-- Pet Health App — Initial Schema + RLS Policies
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- Extended user profile linked to auth.users
-- ============================================================
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner can read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: owner can insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: owner can update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- TABLE: pets
-- ============================================================
CREATE TABLE public.pets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  species     TEXT NOT NULL,          -- e.g. dog, cat, bird
  breed       TEXT,
  birthdate   DATE,
  photo_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pets: owner can read"
  ON public.pets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "pets: owner can insert"
  ON public.pets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pets: owner can update"
  ON public.pets FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "pets: owner can delete"
  ON public.pets FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- TABLE: weight_logs
-- Time-series weight data per pet
-- ============================================================
CREATE TABLE public.weight_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id      UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  weight_kg   NUMERIC(6,3) NOT NULL,
  logged_at   DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weight_logs: owner can read"
  ON public.weight_logs FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "weight_logs: owner can insert"
  ON public.weight_logs FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "weight_logs: owner can update"
  ON public.weight_logs FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "weight_logs: owner can delete"
  ON public.weight_logs FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- TABLE: health_records
-- Vaccination and consultation history
-- ============================================================
CREATE TYPE public.health_record_type AS ENUM ('vaccine', 'consultation', 'exam', 'surgery', 'other');

CREATE TABLE public.health_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pet_id          UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  record_type     public.health_record_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  veterinarian    TEXT,
  record_date     DATE NOT NULL,
  attachment_urls TEXT[],             -- array of Supabase Storage URLs
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_records: owner can read"
  ON public.health_records FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "health_records: owner can insert"
  ON public.health_records FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "health_records: owner can update"
  ON public.health_records FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "health_records: owner can delete"
  ON public.health_records FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- TABLE: vets
-- Veterinarian registry
-- ============================================================
CREATE TABLE public.vets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  clinic      TEXT,
  phone       TEXT,
  email       TEXT,
  specialty   TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vets: owner can read"
  ON public.vets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "vets: owner can insert"
  ON public.vets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "vets: owner can update"
  ON public.vets FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "vets: owner can delete"
  ON public.vets FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- TABLE: appointments
-- Shared agenda: links pets, vets, and users
-- ============================================================
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'completed', 'cancelled');

CREATE TABLE public.appointments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments: owner can read"
  ON public.appointments FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "appointments: owner can insert"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "appointments: owner can update"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "appointments: owner can delete"
  ON public.appointments FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- TABLE: reminders
-- Push notification reminders linked to pets
-- ============================================================
CREATE TYPE public.reminder_type AS ENUM ('vaccine', 'consultation', 'medication', 'exam', 'other');

CREATE TABLE public.reminders (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id              UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  reminder_type       public.reminder_type NOT NULL,
  remind_at           TIMESTAMPTZ NOT NULL,
  is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_days     INTEGER,        -- interval in days if recurring
  expo_push_token     TEXT,           -- store device token for targeted push
  local_notification_id TEXT,         -- Expo local notification identifier
  is_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders: owner can read"
  ON public.reminders FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "reminders: owner can insert"
  ON public.reminders FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "reminders: owner can update"
  ON public.reminders FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "reminders: owner can delete"
  ON public.reminders FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- TABLE: pet_vets  (many-to-many: pets ↔ vets)
-- ============================================================
CREATE TABLE public.pet_vets (
  pet_id   UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vet_id   UUID NOT NULL REFERENCES public.vets(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (pet_id, vet_id)
);

ALTER TABLE public.pet_vets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_vets: owner can read"
  ON public.pet_vets FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "pet_vets: owner can insert"
  ON public.pet_vets FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pet_vets: owner can delete"
  ON public.pet_vets FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================================
-- STORAGE BUCKETS  (run via Supabase dashboard or CLI)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pet-photos', 'pet-photos', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('record-attachments', 'record-attachments', false);
--
-- Storage RLS policies:
-- CREATE POLICY "pet-photos: owner only"
--   ON storage.objects FOR ALL
--   USING (auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "record-attachments: owner only"
--   ON storage.objects FOR ALL
--   USING (auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- INDEXES for common query patterns
-- ============================================================
CREATE INDEX idx_pets_owner_id ON public.pets(owner_id);
CREATE INDEX idx_health_records_pet_id ON public.health_records(pet_id);
CREATE INDEX idx_health_records_owner_id ON public.health_records(owner_id);
CREATE INDEX idx_weight_logs_pet_id ON public.weight_logs(pet_id);
CREATE INDEX idx_weight_logs_logged_at ON public.weight_logs(logged_at);
CREATE INDEX idx_reminders_owner_id ON public.reminders(owner_id);
CREATE INDEX idx_reminders_remind_at ON public.reminders(remind_at);
CREATE INDEX idx_appointments_owner_id ON public.appointments(owner_id);
CREATE INDEX idx_appointments_appointment_at ON public.appointments(appointment_at);
CREATE INDEX idx_appointments_pet_id ON public.appointments(pet_id);

-- ============================================================================
-- SUPABASE SNAPSHOT — Pre-Bookings State (2026-03-17)
-- Recreates all public schema objects: tables, indexes, constraints,
-- functions, triggers, RLS policies, and role grants.
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
-- (btree_gist was NOT enabled at this snapshot point)

-- ── Sequences ───────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS public.hotels_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.locations_id_seq;

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE public.profiles (
  id          uuid        NOT NULL,
  email       text        NOT NULL,
  full_name   text,
  reward_points integer   DEFAULT 0,
  role        text        DEFAULT 'customer'::text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.locations (
  id            integer         NOT NULL DEFAULT nextval('public.locations_id_seq'::regclass),
  address_line1 varchar(255)    NOT NULL,
  address_line2 varchar(255),
  city          varchar(100)    NOT NULL,
  state         varchar(100),
  country       varchar(100)    NOT NULL,
  postal_code   varchar(20),
  latitude      numeric(9,6),
  longitude     numeric(9,6)
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hotels (
  id              integer         NOT NULL DEFAULT nextval('public.hotels_id_seq'::regclass),
  name            varchar(255)    NOT NULL,
  description     text,
  star_rating     numeric(2,1),
  review_score    numeric(3,2),
  review_count    integer         DEFAULT 0,
  floors          integer,
  total_rooms     integer,
  check_in_time   time,
  check_out_time  time,
  min_check_in_age integer       DEFAULT 18,
  destination_fee numeric(10,2),
  currency        varchar(10)     DEFAULT 'USD'::varchar,
  location_id     integer,
  created_at      timestamp       DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hotel_searches (
  id          uuid        NOT NULL DEFAULT gen_random_uuid(),
  user_id     uuid,
  hotel_id    text        NOT NULL,
  hotel_name  text,
  destination text,
  checkin     date,
  checkout    date,
  rate_usd    numeric,
  searched_at timestamptz DEFAULT now()
);
ALTER TABLE public.hotel_searches ENABLE ROW LEVEL SECURITY;

-- ── Sequence ownership ──────────────────────────────────────────────────────
ALTER SEQUENCE public.hotels_id_seq    OWNED BY public.hotels.id;
ALTER SEQUENCE public.locations_id_seq OWNED BY public.locations.id;

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX profiles_pkey        ON public.profiles USING btree (id);
CREATE UNIQUE INDEX profiles_email_key   ON public.profiles USING btree (email);
CREATE UNIQUE INDEX locations_pkey       ON public.locations USING btree (id);
CREATE UNIQUE INDEX hotels_pkey          ON public.hotels USING btree (id);
CREATE UNIQUE INDEX hotel_searches_pkey  ON public.hotel_searches USING btree (id);
CREATE INDEX hotel_searches_user_idx        ON public.hotel_searches USING btree (user_id);
CREATE INDEX hotel_searches_destination_idx ON public.hotel_searches USING btree (destination, checkin);

-- ── Primary Keys ────────────────────────────────────────────────────────────
ALTER TABLE public.profiles       ADD CONSTRAINT profiles_pkey       PRIMARY KEY USING INDEX profiles_pkey;
ALTER TABLE public.locations      ADD CONSTRAINT locations_pkey      PRIMARY KEY USING INDEX locations_pkey;
ALTER TABLE public.hotels         ADD CONSTRAINT hotels_pkey         PRIMARY KEY USING INDEX hotels_pkey;
ALTER TABLE public.hotel_searches ADD CONSTRAINT hotel_searches_pkey PRIMARY KEY USING INDEX hotel_searches_pkey;

-- ── Foreign Keys & Checks ───────────────────────────────────────────────────
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key
  UNIQUE USING INDEX profiles_email_key;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY['customer'::text, 'property_owner'::text]));

ALTER TABLE public.hotels ADD CONSTRAINT hotels_location_id_fkey
  FOREIGN KEY (location_id) REFERENCES public.locations(id);

ALTER TABLE public.hotel_searches ADD CONSTRAINT hotel_searches_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── Functions ───────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_reward_points(p_user_id uuid, p_points integer)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET reward_points = reward_points + p_points
  WHERE id = p_user_id;
END;
$$;

-- ── Triggers ────────────────────────────────────────────────────────────────
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── RLS Policies ────────────────────────────────────────────────────────────
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO public
  USING (auth.uid() = id);

CREATE POLICY "Hotels are publicly readable"
  ON public.hotels FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Locations are publicly readable"
  ON public.locations FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view own searches"
  ON public.hotel_searches FOR SELECT TO public
  USING (auth.uid() = user_id);

-- ── Role Grants ─────────────────────────────────────────────────────────────
-- (Supabase default: full CRUD for anon, authenticated, service_role)
GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON TABLE public.profiles TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON TABLE public.hotels TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON TABLE public.locations TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES, TRIGGER, TRUNCATE
  ON TABLE public.hotel_searches TO anon, authenticated, service_role;

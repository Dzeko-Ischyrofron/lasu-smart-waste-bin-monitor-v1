
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'viewer', 'collector');
CREATE TYPE public.lid_status AS ENUM ('open', 'closed');
CREATE TYPE public.odor_level AS ENUM ('normal', 'moderate', 'high');
CREATE TYPE public.alert_type AS ENUM ('critical', 'warning', 'info');
CREATE TYPE public.alert_category AS ENUM ('fill', 'battery', 'odor', 'lid', 'connection');
CREATE TYPE public.activity_type AS ENUM ('alert', 'fill', 'collection', 'control', 'system');
CREATE TYPE public.schedule_status AS ENUM ('pending', 'completed', 'cancelled');
CREATE TYPE public.priority_level AS ENUM ('low', 'medium', 'high');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ ROLE CHECK FUNCTION ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============ AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );

  -- First user becomes admin, everyone else viewer
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ BINS ============
CREATE TABLE public.bins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  device_api_key TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  fill_level INTEGER NOT NULL DEFAULT 0,
  lid_status public.lid_status NOT NULL DEFAULT 'closed',
  odor_level public.odor_level NOT NULL DEFAULT 'normal',
  battery INTEGER NOT NULL DEFAULT 100,
  is_online BOOLEAN NOT NULL DEFAULT false,
  hand_detected BOOLEAN NOT NULL DEFAULT false,
  last_update TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bins ENABLE ROW LEVEL SECURITY;

-- ============ SENSOR READINGS (time-series) ============
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id TEXT NOT NULL REFERENCES public.bins(id) ON DELETE CASCADE,
  ultrasonic_cm NUMERIC,
  fill_percent INTEGER,
  ir_sensor BOOLEAN,
  mq135_ppm INTEGER,
  servo_angle INTEGER,
  battery INTEGER,
  signal_strength INTEGER,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sensor_readings_bin_time ON public.sensor_readings (bin_id, recorded_at DESC);
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

-- ============ ALERTS ============
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id TEXT REFERENCES public.bins(id) ON DELETE CASCADE,
  type public.alert_type NOT NULL,
  category public.alert_category NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- ============ ACTIVITIES ============
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id TEXT REFERENCES public.bins(id) ON DELETE CASCADE,
  type public.activity_type NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- ============ SCHEDULE ============
CREATE TABLE public.schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id TEXT NOT NULL REFERENCES public.bins(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  estimated_fill INTEGER,
  status public.schedule_status NOT NULL DEFAULT 'pending',
  priority public.priority_level NOT NULL DEFAULT 'medium',
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schedule ENABLE ROW LEVEL SECURITY;

-- ============ CONTROL COMMANDS (queued for ESP32 to pull) ============
CREATE TABLE public.control_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bin_id TEXT NOT NULL REFERENCES public.bins(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  payload JSONB,
  issued_by UUID REFERENCES auth.users(id),
  executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);
ALTER TABLE public.control_commands ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============

-- profiles: own profile read/update; admins can read all
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

-- user_roles: users see own; admins manage
CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "roles_admin_all" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- bins: any authenticated can read; admins can write
CREATE POLICY "bins_select_auth" ON public.bins FOR SELECT TO authenticated USING (true);
CREATE POLICY "bins_admin_write" ON public.bins FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- sensor readings: all auth read
CREATE POLICY "sensors_select_auth" ON public.sensor_readings FOR SELECT TO authenticated USING (true);

-- alerts: all auth read; admins can update (acknowledge)
CREATE POLICY "alerts_select_auth" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "alerts_admin_update" ON public.alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- activities: all auth read
CREATE POLICY "activities_select_auth" ON public.activities FOR SELECT TO authenticated USING (true);

-- schedule: all auth read; admins write; collectors can mark completed
CREATE POLICY "schedule_select_auth" ON public.schedule FOR SELECT TO authenticated USING (true);
CREATE POLICY "schedule_admin_all" ON public.schedule FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "schedule_collector_complete" ON public.schedule FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'collector')) WITH CHECK (public.has_role(auth.uid(), 'collector'));

-- control_commands: admins issue; viewers read
CREATE POLICY "controls_select_auth" ON public.control_commands FOR SELECT TO authenticated USING (true);
CREATE POLICY "controls_admin_insert" ON public.control_commands FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.bins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

-- ============ SEED DEMO BIN ============
INSERT INTO public.bins (id, name, location, fill_level, lid_status, odor_level, battery, is_online)
VALUES ('BIN-001', 'Smart Waste Bin', 'Main Location', 0, 'closed', 'normal', 100, false);

-- 1. Realtime publication + REPLICA IDENTITY FULL
ALTER TABLE public.bins REPLICA IDENTITY FULL;
ALTER TABLE public.sensor_readings REPLICA IDENTITY FULL;
ALTER TABLE public.alerts REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.schedule REPLICA IDENTITY FULL;
ALTER TABLE public.control_commands REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.bins; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.activities; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.schedule; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.control_commands; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- 2. Map coordinates on bins
ALTER TABLE public.bins
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

-- 3. Offline detection (pg_cron, pure SQL — no HTTP needed)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Unschedule prior version if re-running
DO $$
BEGIN
  PERFORM cron.unschedule(jobid)
  FROM cron.job
  WHERE jobname = 'mark-bins-offline';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'mark-bins-offline',
  '* * * * *',
  $$
  UPDATE public.bins
  SET is_online = false
  WHERE is_online = true
    AND last_update < (now() - interval '5 minutes');
  $$
);

ALTER TABLE public.bin_assignments  DROP CONSTRAINT bin_assignments_bin_id_fkey;
ALTER TABLE public.sensor_readings  DROP CONSTRAINT sensor_readings_bin_id_fkey;
ALTER TABLE public.alerts           DROP CONSTRAINT alerts_bin_id_fkey;
ALTER TABLE public.activities       DROP CONSTRAINT activities_bin_id_fkey;
ALTER TABLE public.schedule         DROP CONSTRAINT schedule_bin_id_fkey;
ALTER TABLE public.control_commands DROP CONSTRAINT control_commands_bin_id_fkey;

UPDATE public.bins             SET id     = 'BIN_001' WHERE id     = 'BIN-001';
UPDATE public.bin_assignments  SET bin_id = 'BIN_001' WHERE bin_id = 'BIN-001';
UPDATE public.sensor_readings  SET bin_id = 'BIN_001' WHERE bin_id = 'BIN-001';
UPDATE public.alerts           SET bin_id = 'BIN_001' WHERE bin_id = 'BIN-001';
UPDATE public.activities       SET bin_id = 'BIN_001' WHERE bin_id = 'BIN-001';
UPDATE public.schedule         SET bin_id = 'BIN_001' WHERE bin_id = 'BIN-001';
UPDATE public.control_commands SET bin_id = 'BIN_001' WHERE bin_id = 'BIN-001';

ALTER TABLE public.bin_assignments  ADD CONSTRAINT bin_assignments_bin_id_fkey  FOREIGN KEY (bin_id) REFERENCES public.bins(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.sensor_readings  ADD CONSTRAINT sensor_readings_bin_id_fkey  FOREIGN KEY (bin_id) REFERENCES public.bins(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.alerts           ADD CONSTRAINT alerts_bin_id_fkey           FOREIGN KEY (bin_id) REFERENCES public.bins(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.activities       ADD CONSTRAINT activities_bin_id_fkey       FOREIGN KEY (bin_id) REFERENCES public.bins(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.schedule         ADD CONSTRAINT schedule_bin_id_fkey         FOREIGN KEY (bin_id) REFERENCES public.bins(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.control_commands ADD CONSTRAINT control_commands_bin_id_fkey FOREIGN KEY (bin_id) REFERENCES public.bins(id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.sync_bin_from_telemetry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_fill int;
  new_fill  int;
  odor      public.odor_level;
BEGIN
  new_fill := LEAST(100, GREATEST(0, COALESCE(round(NEW.waste_pct)::int, 0)));

  SELECT fill_level INTO prev_fill FROM public.bins WHERE id = NEW.bin_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  odor := CASE
    WHEN COALESCE(NEW.gas_alert, false) OR COALESCE(NEW.gas_ppm_est, 0) > 300 THEN 'high'::public.odor_level
    WHEN COALESCE(NEW.gas_ppm_est, 0) > 150 THEN 'moderate'::public.odor_level
    ELSE 'normal'::public.odor_level
  END;

  UPDATE public.bins SET
    fill_level    = new_fill,
    lid_status    = CASE WHEN COALESCE(NEW.lid_open, false) THEN 'open'::public.lid_status ELSE 'closed'::public.lid_status END,
    odor_level    = odor,
    hand_detected = COALESCE(NEW.pir_detected, false),
    is_online     = true,
    last_update   = NEW.created_at
  WHERE id = NEW.bin_id;

  IF new_fill >= 80 AND COALESCE(prev_fill, 0) < 80 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.alerts
      WHERE bin_id = NEW.bin_id AND category = 'fill' AND acknowledged = false
    ) THEN
      INSERT INTO public.alerts (bin_id, type, category, message)
      VALUES (NEW.bin_id, 'critical', 'fill', 'Bin reached ' || new_fill || '% capacity');
    END IF;

    INSERT INTO public.activities (bin_id, type, message)
    VALUES (NEW.bin_id, 'fill', 'Fill level reached ' || new_fill || '%');
  END IF;

  IF odor = 'high' AND NOT EXISTS (
    SELECT 1 FROM public.alerts
    WHERE bin_id = NEW.bin_id AND category = 'odor' AND acknowledged = false
  ) THEN
    INSERT INTO public.alerts (bin_id, type, category, message)
    VALUES (NEW.bin_id, 'critical', 'odor',
      'Critical odor level (' || COALESCE(round(NEW.gas_ppm_est)::text, 'high') || ' ppm) — immediate attention required');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_bin_from_telemetry ON public.waste_bin_telemetry;
CREATE TRIGGER trg_sync_bin_from_telemetry
AFTER INSERT ON public.waste_bin_telemetry
FOR EACH ROW EXECUTE FUNCTION public.sync_bin_from_telemetry();

CREATE OR REPLACE FUNCTION public.log_control_command_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activities (bin_id, type, message)
  VALUES (NEW.bin_id, 'control', 'Command "' || NEW.command || '" queued');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_control_command ON public.control_commands;
CREATE TRIGGER trg_log_control_command
AFTER INSERT ON public.control_commands
FOR EACH ROW EXECUTE FUNCTION public.log_control_command_activity();

UPDATE public.bins b SET
  fill_level    = LEAST(100, GREATEST(0, COALESCE(round(v.waste_pct)::int, b.fill_level))),
  lid_status    = CASE WHEN COALESCE(v.lid_open, false) THEN 'open'::public.lid_status ELSE 'closed'::public.lid_status END,
  odor_level    = CASE
                    WHEN COALESCE(v.gas_alert, false) OR COALESCE(v.gas_ppm_est, 0) > 300 THEN 'high'::public.odor_level
                    WHEN COALESCE(v.gas_ppm_est, 0) > 150 THEN 'moderate'::public.odor_level
                    ELSE 'normal'::public.odor_level
                  END,
  hand_detected = COALESCE(v.pir_detected, false),
  is_online     = true,
  last_update   = v.created_at
FROM public.vw_bin_latest v
WHERE v.bin_id = b.id;

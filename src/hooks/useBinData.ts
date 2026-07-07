import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Bin = Omit<Database["public"]["Tables"]["bins"]["Row"], "device_api_key">;
const BIN_COLS = "id,name,location,fill_level,lid_status,odor_level,battery,is_online,hand_detected,last_update,created_at,latitude,longitude" as const;

// Normalized reading shape derived from waste_bin_telemetry rows.
// Kept backwards compatible with the previous sensor_readings-based UI.
export type NormalizedReading = {
  id: number | string;
  bin_id: string;
  recorded_at: string;
  fill_percent: number | null;
  ultrasonic_cm: number | null;
  ir_sensor: boolean | null;
  mq135_ppm: number | null;
  servo_angle: number | null;
  battery: number | null;
  signal_strength: number | null;
};

type TelemetryRow = Database["public"]["Tables"]["waste_bin_telemetry"]["Row"];

// Map a raw telemetry row to the normalized reading shape the UI expects.
function toReading(r: TelemetryRow): NormalizedReading {
  const rssi = r.rssi_dbm ?? null;
  // Map RSSI dBm (-100..-30) to a 0..100 signal-strength percentage.
  const signal =
    rssi === null ? null : Math.max(0, Math.min(100, Math.round(2 * (rssi + 100))));
  return {
    id: r.id,
    bin_id: r.bin_id,
    recorded_at: r.created_at,
    fill_percent: r.waste_pct === null ? null : Number(r.waste_pct),
    ultrasonic_cm:
      r.distance_cm !== null && r.distance_cm !== undefined
        ? Number(r.distance_cm)
        : r.waste_filled_cm !== null && r.waste_filled_cm !== undefined
        ? Number(r.waste_filled_cm)
        : null,
    ir_sensor: r.pir_detected,
    mq135_ppm: r.gas_ppm_est === null ? null : Number(r.gas_ppm_est),
    servo_angle: r.lid_open ? 90 : 0,
    battery: null, // telemetry has no battery reading; UI falls back to bins.battery
    signal_strength: signal,
  };
}

type Alert = Database["public"]["Tables"]["alerts"]["Row"];
type Activity = Database["public"]["Tables"]["activities"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["schedule"]["Row"];

export function useBinData(binId: string | null) {
  const [bin, setBin] = useState<Bin | null>(null);
  const [readings, setReadings] = useState<NormalizedReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!binId) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);

    const fetchAll = async () => {
      const [binRes, telemetryRes, alertsRes, activitiesRes, scheduleRes] = await Promise.all([
        supabase.from("bins").select(BIN_COLS).eq("id", binId).maybeSingle(),
        supabase.from("waste_bin_telemetry").select("*").eq("bin_id", binId).order("created_at", { ascending: false }).limit(200),
        supabase.from("alerts").select("*").eq("acknowledged", false).order("created_at", { ascending: false }).limit(20),
        supabase.from("activities").select("*").eq("bin_id", binId).order("created_at", { ascending: false }).limit(20),
        supabase.from("schedule").select("*").eq("bin_id", binId).order("scheduled_time", { ascending: false }).limit(20),
      ]);
      if (!mounted) return;
      setBin(binRes.data ?? null);
      setReadings((telemetryRes.data ?? []).map(toReading));
      setAlerts(alertsRes.data ?? []);
      setActivities(activitiesRes.data ?? []);
      setSchedule(scheduleRes.data ?? []);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel(`bin-live-${binId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bins", filter: `id=eq.${binId}` }, (payload) => {
        if (payload.new) setBin(payload.new as Bin);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "waste_bin_telemetry", filter: `bin_id=eq.${binId}` }, (payload) => {
        setReadings((prev) => [toReading(payload.new as TelemetryRow), ...prev].slice(0, 200));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        supabase.from("alerts").select("*").eq("acknowledged", false).order("created_at", { ascending: false }).limit(20).then(({ data }) => {
          if (data && mounted) setAlerts(data);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "activities", filter: `bin_id=eq.${binId}` }, () => {
        supabase.from("activities").select("*").eq("bin_id", binId).order("created_at", { ascending: false }).limit(20).then(({ data }) => {
          if (data && mounted) setActivities(data);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule", filter: `bin_id=eq.${binId}` }, () => {
        supabase.from("schedule").select("*").eq("bin_id", binId).order("scheduled_time", { ascending: false }).limit(20).then(({ data }) => {
          if (data && mounted) setSchedule(data);
        });
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [binId]);

  return { bin, readings, alerts, activities, schedule, loading };
}

// Lightweight hook to list all bins (for selector + map)
export function useBinsList() {
  const [bins, setBins] = useState<Bin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("bins").select(BIN_COLS).order("name");
      if (mounted) { setBins(data ?? []); setLoading(false); }
    };
    load();
    const channel = supabase
      .channel("bins-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "bins" }, load)
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return { bins, loading };
}

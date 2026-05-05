import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Bin = Database["public"]["Tables"]["bins"]["Row"];
type SensorReading = Database["public"]["Tables"]["sensor_readings"]["Row"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"];
type Activity = Database["public"]["Tables"]["activities"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["schedule"]["Row"];

export function useBinData(binId: string | null) {
  const [bin, setBin] = useState<Bin | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!binId) { setLoading(false); return; }
    let mounted = true;
    setLoading(true);

    const fetchAll = async () => {
      const [binRes, readingsRes, alertsRes, activitiesRes, scheduleRes] = await Promise.all([
        supabase.from("bins").select("*").eq("id", binId).maybeSingle(),
        supabase.from("sensor_readings").select("*").eq("bin_id", binId).order("recorded_at", { ascending: false }).limit(200),
        supabase.from("alerts").select("*").eq("acknowledged", false).order("created_at", { ascending: false }).limit(20),
        supabase.from("activities").select("*").eq("bin_id", binId).order("created_at", { ascending: false }).limit(20),
        supabase.from("schedule").select("*").eq("bin_id", binId).order("scheduled_time", { ascending: false }).limit(20),
      ]);
      if (!mounted) return;
      setBin(binRes.data ?? null);
      setReadings(readingsRes.data ?? []);
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_readings", filter: `bin_id=eq.${binId}` }, (payload) => {
        setReadings((prev) => [payload.new as SensorReading, ...prev].slice(0, 200));
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
      const { data } = await supabase.from("bins").select("*").order("name");
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

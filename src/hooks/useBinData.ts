import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Bin = Database["public"]["Tables"]["bins"]["Row"];
type SensorReading = Database["public"]["Tables"]["sensor_readings"]["Row"];
type Alert = Database["public"]["Tables"]["alerts"]["Row"];
type Activity = Database["public"]["Tables"]["activities"]["Row"];
type ScheduleRow = Database["public"]["Tables"]["schedule"]["Row"];

export function useBinData(binId: string = "BIN-001") {
  const [bin, setBin] = useState<Bin | null>(null);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAll = async () => {
      const [binRes, readingsRes, alertsRes, activitiesRes, scheduleRes] = await Promise.all([
        supabase.from("bins").select("*").eq("id", binId).maybeSingle(),
        supabase.from("sensor_readings").select("*").eq("bin_id", binId).order("recorded_at", { ascending: false }).limit(100),
        supabase.from("alerts").select("*").eq("acknowledged", false).order("created_at", { ascending: false }).limit(20),
        supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("schedule").select("*").order("scheduled_time", { ascending: false }).limit(20),
      ]);
      if (!mounted) return;
      if (binRes.data) setBin(binRes.data);
      if (readingsRes.data) setReadings(readingsRes.data);
      if (alertsRes.data) setAlerts(alertsRes.data);
      if (activitiesRes.data) setActivities(activitiesRes.data);
      if (scheduleRes.data) setSchedule(scheduleRes.data);
      setLoading(false);
    };

    fetchAll();

    const channel = supabase
      .channel("bin-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "bins", filter: `id=eq.${binId}` }, (payload) => {
        if (payload.new) setBin(payload.new as Bin);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_readings", filter: `bin_id=eq.${binId}` }, (payload) => {
        setReadings((prev) => [payload.new as SensorReading, ...prev].slice(0, 100));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        supabase.from("alerts").select("*").eq("acknowledged", false).order("created_at", { ascending: false }).limit(20).then(({ data }) => {
          if (data && mounted) setAlerts(data);
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => {
        supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(20).then(({ data }) => {
          if (data && mounted) setActivities(data);
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

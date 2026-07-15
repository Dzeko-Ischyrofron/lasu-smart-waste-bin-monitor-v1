import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { TrendRange } from "@/components/dashboard/TrendRangeToggle";

export type TrendBucket = {
  bucket: string;
  fill_avg: number | null;
  gas_avg: number | null;
  gas_alerts: number;
  sample_count: number;
};

export function useTelemetryTrend(binId: string | null, range: TrendRange) {
  const [data, setData] = useState<TrendBucket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!binId) { setData([]); return; }
    let mounted = true;
    setLoading(true);
    const load = async () => {
      const { data: rows } = await (supabase as any).rpc("get_telemetry_trend", {
        _bin_id: binId,
        _range: range,
      });
      if (!mounted) return;
      setData((rows ?? []) as TrendBucket[]);
      setLoading(false);
    };
    load();

    // Refresh on new telemetry so trends stay live
    const channel = supabase
      .channel(`trend-${binId}-${range}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "waste_bin_telemetry", filter: `bin_id=eq.${binId}` },
        () => load()
      )
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [binId, range]);

  return { data, loading };
}

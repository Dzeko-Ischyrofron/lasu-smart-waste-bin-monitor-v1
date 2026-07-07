import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

interface Props {
  binId: string;
}

export function HistoricalAnalytics({ binId }: Props) {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  const exportCsv = async () => {
    setLoading(true);
    const fromIso = new Date(from + "T00:00:00").toISOString();
    const toIso = new Date(to + "T23:59:59").toISOString();

    const { data, error } = await supabase
      .from("waste_bin_telemetry")
      .select("created_at,waste_pct,waste_filled_cm,distance_cm,bin_depth_cm,level_zone,is_full,lid_open,gas_raw,gas_ppm_est,gas_alert,pir_detected,rssi_dbm,wifi_ssid,fw_version,uptime_s")
      .eq("bin_id", binId)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: true })
      .limit(10000);

    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!data || data.length === 0) { toast.info("No readings in that range"); return; }

    const headers = [
      "created_at","waste_pct","waste_filled_cm","distance_cm","bin_depth_cm","level_zone",
      "is_full","lid_open","gas_raw","gas_ppm_est","gas_alert","pir_detected",
      "rssi_dbm","wifi_ssid","fw_version","uptime_s",
    ];
    const rows = data.map((r) =>
      headers.map((h) => {
        const v = (r as Record<string, unknown>)[h];
        if (v === null || v === undefined) return "";
        return typeof v === "string" && v.includes(",") ? `"${v}"` : String(v);
      }).join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${binId}-telemetry-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${data.length} readings`);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Historical Data Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Download all sensor readings for <strong>{binId}</strong> in the selected date range as CSV.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="from">From</Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} max={to} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} min={from} max={format(new Date(), "yyyy-MM-dd")} />
          </div>
        </div>
        <Button onClick={exportCsv} disabled={loading} className="w-full gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export CSV
        </Button>
      </CardContent>
    </Card>
  );
}

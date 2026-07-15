import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Battery } from "lucide-react";
import { format } from "date-fns";
import { TrendRangeToggle, type TrendRange } from "./TrendRangeToggle";
import { useTelemetryTrend } from "@/hooks/useTelemetryTrend";

interface Props {
  binId: string | null;
}

const chartConfig = {
  battery: { label: "Battery Level", color: "hsl(var(--primary))" },
};

function fmtLabel(iso: string, range: TrendRange) {
  const d = new Date(iso);
  if (range === "day") return format(d, "HH:mm");
  if (range === "week") return format(d, "EEE HH:mm");
  return format(d, "MMM d");
}

export function BatteryTrendsChart({ binId }: Props) {
  const [range, setRange] = useState<TrendRange>("day");
  const { data, loading } = useTelemetryTrend(binId, range);

  // Battery telemetry is not yet emitted by the ESP32 firmware; the RPC returns
  // buckets with sample_count but no battery avg. Once the device starts sending
  // battery_pct in waste_bin_telemetry, extend the RPC to include battery_avg
  // and map it here — the toggle/UI shell is already in place.
  const chartData: Array<{ time: string; battery: number }> = data
    .map((d) => ({ time: fmtLabel(d.bucket, range), battery: NaN }))
    .filter((d) => Number.isFinite(d.battery));

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Battery className="h-5 w-5 text-primary" />
          Battery Usage Trends
        </CardTitle>
        <TrendRangeToggle value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] grid place-items-center text-center text-sm text-muted-foreground px-6">
            {loading
              ? "Loading…"
              : "Battery telemetry not yet reported by the device. Once the ESP32 sends battery readings, trends will appear here for the selected range."}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs text-muted-foreground" />
                <YAxis domain={[0, 100]} className="text-xs text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="battery" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

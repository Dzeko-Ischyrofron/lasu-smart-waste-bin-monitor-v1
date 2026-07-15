import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Wind } from "lucide-react";
import { format } from "date-fns";
import { TrendRangeToggle, type TrendRange } from "./TrendRangeToggle";
import { useTelemetryTrend } from "@/hooks/useTelemetryTrend";

interface Props {
  binId: string | null;
}

const chartConfig = {
  level: { label: "Odor Level (ppm)", color: "hsl(var(--warning))" },
  alerts: { label: "Odor Alerts", color: "hsl(var(--destructive))" },
};

function fmtLabel(iso: string, range: TrendRange) {
  const d = new Date(iso);
  if (range === "day") return format(d, "HH:mm");
  if (range === "week") return format(d, "EEE HH:mm");
  return format(d, "MMM d");
}

export function OdorAnalysisChart({ binId }: Props) {
  const [range, setRange] = useState<TrendRange>("day");
  const { data, loading } = useTelemetryTrend(binId, range);

  const chartData = data.map((d) => ({
    hour: fmtLabel(d.bucket, range),
    level: d.gas_avg === null ? 0 : Number(Number(d.gas_avg).toFixed(1)),
    alerts: Number(d.gas_alerts),
  }));

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wind className="h-5 w-5 text-warning" />
          Odor Pattern Analysis
        </CardTitle>
        <TrendRangeToggle value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[250px] grid place-items-center text-sm text-muted-foreground">
            {loading ? "Loading…" : `No telemetry in the last ${range}`}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="hour" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="level" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="alerts" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
        <div className="flex gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">Avg Odor (ppm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Alerts in bucket</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

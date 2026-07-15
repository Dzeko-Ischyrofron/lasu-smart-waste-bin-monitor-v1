import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TrendRangeToggle, type TrendRange } from "./TrendRangeToggle";
import { useTelemetryTrend } from "@/hooks/useTelemetryTrend";

interface FillLevelChartProps {
  binId: string | null;
  title?: string;
}

function fmtLabel(iso: string, range: TrendRange) {
  const d = new Date(iso);
  if (range === "day") return format(d, "HH:mm");
  if (range === "week") return format(d, "EEE HH:mm");
  return format(d, "MMM d");
}

export function FillLevelChart({ binId, title = "Fill Level Trend" }: FillLevelChartProps) {
  const [range, setRange] = useState<TrendRange>("day");
  const { data, loading } = useTelemetryTrend(binId, range);

  const chartData = data
    .filter((d) => d.fill_avg !== null)
    .map((d) => ({ time: fmtLabel(d.bucket, range), fillLevel: Number(d.fill_avg) }));

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <TrendRangeToggle value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full grid place-items-center text-sm text-muted-foreground">
              {loading ? "Loading…" : `No telemetry in the last ${range}`}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(158, 64%, 42%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="time" tick={{ fontSize: 12 }} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: 'hsl(var(--border))' }} tickLine={{ stroke: 'hsl(var(--border))' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Fill Level']}
                />
                <Area type="monotone" dataKey="fillLevel" stroke="hsl(158, 64%, 42%)" strokeWidth={2} fill="url(#fillGradient)" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

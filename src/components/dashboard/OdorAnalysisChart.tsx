import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Wind } from "lucide-react";

interface OdorAnalysisChartProps {
  data: Array<{ hour: string; level: number; alerts: number }>;
}

const chartConfig = {
  level: { label: "Odor Level (ppm)", color: "hsl(var(--warning))" },
  alerts: { label: "Odor Alerts", color: "hsl(var(--destructive))" },
};

export function OdorAnalysisChart({ data }: OdorAnalysisChartProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Wind className="h-5 w-5 text-warning" />
          Odor Pattern Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="hour" className="text-xs text-muted-foreground" />
              <YAxis className="text-xs text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="level" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="alerts" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="flex gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">Odor Level (ppm)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive" />
            <span className="text-muted-foreground">Odor Alerts Triggered</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

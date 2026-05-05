import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { Battery } from "lucide-react";

interface BatteryTrendsChartProps {
  data: Array<{ time: string; battery: number }>;
}

const chartConfig = {
  battery: { label: "Battery Level", color: "hsl(var(--primary))" },
};

export function BatteryTrendsChart({ data }: BatteryTrendsChartProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Battery className="h-5 w-5 text-primary" />
          Battery Usage Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="time" className="text-xs text-muted-foreground" />
              <YAxis domain={[0, 100]} className="text-xs text-muted-foreground" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="battery" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

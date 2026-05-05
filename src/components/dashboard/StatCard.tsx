import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: "success" | "warning" | "danger" | "info";
  className?: string;
}

const statusColors = {
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

const statusBgColors = {
  success: "bg-success/10",
  warning: "bg-warning/10",
  danger: "bg-danger/10",
  info: "bg-info/10",
};

export function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  status = "success",
  className,
}: StatCardProps) {
  return (
    <Card variant="stat" className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
              {unit && (
                <span className="text-sm font-medium text-muted-foreground">
                  {unit}
                </span>
              )}
            </div>
            {trend && (
              <p
                className={cn(
                  "text-xs font-medium",
                  trend.isPositive ? "text-success" : "text-danger"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}% from last
                hour
              </p>
            )}
          </div>
          <div
            className={cn(
              "p-3 rounded-xl",
              statusBgColors[status]
            )}
          >
            <Icon className={cn("h-6 w-6", statusColors[status])} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

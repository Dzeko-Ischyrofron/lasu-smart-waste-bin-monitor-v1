import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, ArrowUp, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "fill" | "alert" | "collection";
  message: string;
  time: string;
}

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

const activityIcons = {
  fill: ArrowUp,
  alert: AlertTriangle,
  collection: CheckCircle,
};

const activityColors = {
  fill: "text-info bg-info/10",
  alert: "text-warning bg-warning/10",
  collection: "text-success bg-success/10",
};

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  return (
    <Card variant="elevated" className="animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className={cn("p-2 rounded-lg", activityColors[activity.type])}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

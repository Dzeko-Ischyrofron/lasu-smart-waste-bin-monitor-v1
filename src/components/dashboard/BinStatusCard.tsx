import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Trash2, MapPin, Battery, Wifi, DoorOpen, DoorClosed, Wind, Hand, AlertCircle, ShieldAlert } from "lucide-react";

interface BinStatusCardProps {
  id: string;
  name: string;
  location: string;
  fillLevel: number;
  lidStatus: "open" | "closed";
  odorLevel: "normal" | "moderate" | "high";
  battery: number;
  isOnline: boolean;
  lastUpdate: string;
  handDetected?: boolean;
}

const getFillStatus = (level: number) => {
  if (level >= 80) return { color: "bg-danger", status: "Critical", textColor: "text-danger" };
  if (level >= 60) return { color: "bg-warning", status: "Warning", textColor: "text-warning" };
  return { color: "bg-success", status: "Normal", textColor: "text-success" };
};

const getOdorStatus = (level: string) => {
  if (level === "high") return { color: "text-danger", bg: "bg-danger/10" };
  if (level === "moderate") return { color: "text-warning", bg: "bg-warning/10" };
  return { color: "text-success", bg: "bg-success/10" };
};

export function BinStatusCard({
  id,
  name,
  location,
  fillLevel,
  lidStatus,
  odorLevel,
  battery,
  isOnline,
  lastUpdate,
  handDetected = false,
}: BinStatusCardProps) {
  const fillStatus = getFillStatus(fillLevel);
  const odorStatus = getOdorStatus(odorLevel);

  return (
    <Card variant="elevated" className="overflow-hidden animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl",
              fillLevel >= 80 ? "bg-danger/10" : fillLevel >= 60 ? "bg-warning/10" : "bg-success/10"
            )}>
              <Trash2 className={cn("h-5 w-5", fillStatus.textColor)} />
            </div>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <Wifi className={cn("h-4 w-4", isOnline ? "text-success" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium", isOnline ? "text-success" : "text-muted-foreground")}>
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
            {fillLevel >= 80 && (
              <div className="flex items-center gap-1 text-danger animate-pulse">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Full</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fill Level */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fill Level</span>
            <span className={cn("font-semibold", fillStatus.textColor)}>
              {fillLevel}% - {fillStatus.status}
            </span>
          </div>
          <div className="relative">
            <Progress value={fillLevel} className="h-3" />
            <div
              className={cn(
                "absolute inset-0 h-3 rounded-full transition-all",
                fillStatus.color
              )}
              style={{ width: `${fillLevel}%` }}
            />
          </div>
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Lid Status */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
            {lidStatus === "open" ? (
              <DoorOpen className="h-4 w-4 text-warning" />
            ) : (
              <DoorClosed className="h-4 w-4 text-success" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Lid</p>
              <p className={cn("text-sm font-semibold capitalize", lidStatus === "open" ? "text-warning" : "text-success")}>
                {lidStatus}
              </p>
            </div>
          </div>

          {/* Odor Level */}
          <div className={cn("flex items-center gap-2 p-2.5 rounded-lg", odorStatus.bg)}>
            <Wind className={cn("h-4 w-4", odorStatus.color)} />
            <div>
              <p className="text-xs text-muted-foreground">Odor</p>
              <p className={cn("text-sm font-semibold capitalize", odorStatus.color)}>
                {odorLevel}
              </p>
            </div>
          </div>

          {/* Battery */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50">
            <Battery className={cn("h-4 w-4", battery < 20 ? "text-danger" : battery < 40 ? "text-warning" : "text-success")} />
            <div>
              <p className="text-xs text-muted-foreground">Battery</p>
              <p className="text-sm font-semibold">{battery}%</p>
            </div>
          </div>

          {/* Hand Detection */}
          <div className={cn(
            "flex items-center gap-2 p-2.5 rounded-lg",
            handDetected ? "bg-info/10" : "bg-secondary/50"
          )}>
            <Hand className={cn("h-4 w-4", handDetected ? "text-info" : "text-muted-foreground")} />
            <div>
              <p className="text-xs text-muted-foreground">Motion</p>
              <p className={cn("text-sm font-semibold", handDetected ? "text-info" : "text-muted-foreground")}>
                {handDetected ? "Detected" : "None"}
              </p>
            </div>
          </div>
        </div>

        {/* Odor Emergency Alert */}
        {odorLevel !== "normal" && (
          <div className={cn(
            "flex items-center gap-2 p-2 rounded-lg border",
            odorLevel === "high" ? "bg-destructive/10 border-destructive/20" : "bg-warning/10 border-warning/20"
          )}>
            <ShieldAlert className={cn("h-4 w-4 animate-pulse", odorLevel === "high" ? "text-destructive" : "text-warning")} />
            <span className={cn("text-sm font-medium", odorLevel === "high" ? "text-destructive" : "text-warning")}>
              {odorLevel === "high" ? "⚠️ Emergency: Critical odor level — immediate attention required" : "Elevated odor detected — monitor closely"}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">ID: {id}</span>
          <span className="text-xs text-muted-foreground">Updated: {lastUpdate}</span>
        </div>
      </CardContent>
    </Card>
  );
}
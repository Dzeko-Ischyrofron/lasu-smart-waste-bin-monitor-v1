import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Map, Trash2, Battery, Wifi, WifiOff, AlertTriangle } from "lucide-react";

interface BinLocation {
  id: string;
  name: string;
  location: string;
  fillLevel: number;
  battery: number;
  isOnline: boolean;
  status: "normal" | "warning" | "critical";
}

interface FleetOverviewProps {
  bin: BinLocation;
}

const statusColors = {
  normal: "bg-primary",
  warning: "bg-warning",
  critical: "bg-destructive",
};

export function FleetOverview({ bin }: FleetOverviewProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Map className="h-5 w-5 text-primary" />
          Bin Overview
        </CardTitle>
        <Badge variant="outline" className="gap-1">
          {bin.isOnline ? (
            <>
              <Wifi className="h-3 w-3 text-primary" />
              Online
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-destructive" />
              Offline
            </>
          )}
        </Badge>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="flex items-center justify-center gap-2 text-primary mb-1">
              <Trash2 className="h-4 w-4" />
              <span className="text-lg font-bold">{bin.fillLevel}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Fill Level</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-info/10">
            <div className="flex items-center justify-center gap-2 text-info mb-1">
              <Battery className="h-4 w-4" />
              <span className="text-lg font-bold">{bin.battery}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Battery</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            bin.status === "critical" ? "bg-destructive/10" : 
            bin.status === "warning" ? "bg-warning/10" : "bg-primary/10"
          }`}>
            <div className={`flex items-center justify-center gap-2 mb-1 ${
              bin.status === "critical" ? "text-destructive" : 
              bin.status === "warning" ? "text-warning" : "text-primary"
            }`}>
              {bin.status === "critical" || bin.status === "warning" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <div className={`w-3 h-3 rounded-full ${statusColors[bin.status]}`} />
              )}
              <span className="text-lg font-bold capitalize">{bin.status}</span>
            </div>
            <p className="text-xs text-muted-foreground">Status</p>
          </div>
        </div>

        {/* Bin Card Visualization */}
        <div className="relative h-[150px] bg-muted/30 rounded-lg border overflow-hidden flex items-center justify-center">
          <div
            className={`relative flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${
              bin.isOnline ? "bg-card" : "bg-muted/50"
            } ${
              bin.status === "critical"
                ? "border-destructive"
                : bin.status === "warning"
                ? "border-warning"
                : "border-primary/30"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full ${statusColors[bin.status]} ${
                bin.status === "critical" ? "animate-pulse" : ""
              }`}
            />
            <span className="text-sm font-medium mt-2">{bin.name}</span>
            <span className="text-xs text-muted-foreground">{bin.location}</span>
            {!bin.isOnline && (
              <WifiOff className="absolute top-2 right-2 h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-muted-foreground">Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

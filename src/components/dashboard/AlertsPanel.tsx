import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Battery, Wind, DoorOpen, Wifi, X, Bell, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Alert {
  id: string;
  type: "critical" | "warning" | "info";
  category: "fill" | "battery" | "odor" | "lid" | "connection" | "connectivity";
  message: string;
  binId: string;
  time: string;
}

interface AlertsPanelProps { alerts: Alert[]; }

const categoryIcons = { fill: AlertTriangle, battery: Battery, odor: Wind, lid: DoorOpen, connection: Wifi, connectivity: Wifi };
const typeStyles = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  info: "bg-info/10 text-info border-info/20",
};
const badgeStyles = {
  critical: "bg-destructive text-destructive-foreground",
  warning: "bg-warning text-warning-foreground",
  info: "bg-info text-primary-foreground",
};

export function AlertsPanel({ alerts: alertsProp }: AlertsPanelProps) {
  const { isAdmin } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const alerts = alertsProp.filter((a) => !dismissed.has(a.id));

  const ack = async (id: string) => {
    if (!isAdmin) { toast.error("Only admins can dismiss alerts"); return; }
    setBusy(id);
    setDismissed((p) => new Set(p).add(id));
    const { error } = await supabase.from("alerts").update({ acknowledged: true }).eq("id", id);
    setBusy(null);
    if (error) {
      setDismissed((p) => { const n = new Set(p); n.delete(id); return n; });
      toast.error(error.message);
    } else toast.success("Dismissed");
  };

  const clearAll = async () => {
    if (!isAdmin) { toast.error("Only admins can clear alerts"); return; }
    if (alerts.length === 0) return;
    setBusy("all");
    const ids = alerts.map((a) => a.id);
    setDismissed((p) => { const n = new Set(p); ids.forEach((i) => n.add(i)); return n; });
    const { error } = await supabase.from("alerts").update({ acknowledged: true }).in("id", ids);
    setBusy(null);
    if (error) {
      setDismissed((p) => { const n = new Set(p); ids.forEach((i) => n.delete(i)); return n; });
      toast.error(error.message);
    } else toast.success("All cleared");
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-destructive" />
          Alerts & Notifications
          {alerts.length > 0 && <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>}
        </CardTitle>
        {alerts.length > 0 && isAdmin && (
          <Button variant="ghost" size="sm" onClick={clearAll} disabled={busy !== null} className="text-muted-foreground">
            {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clear All"}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-2 opacity-20" />
            <p>No active alerts</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {alerts.map((alert) => {
              const Icon = categoryIcons[alert.category] ?? AlertTriangle;
              return (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${typeStyles[alert.type]}`}>
                  <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={badgeStyles[alert.type]} variant="secondary">{alert.type.toUpperCase()}</Badge>
                      <span className="text-xs opacity-70">{alert.binId}</span>
                    </div>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs opacity-70 mt-1">{alert.time}</p>
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" disabled={busy === alert.id} onClick={() => ack(alert.id)}>
                      {busy === alert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

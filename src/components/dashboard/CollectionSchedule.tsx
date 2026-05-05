import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Clock, Truck, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ScheduleItem {
  id: string;
  binId: string;
  binName: string;
  location: string;
  scheduledTime: string;
  estimatedFill: number;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
}

interface BinOpt { id: string; name: string; }

interface CollectionScheduleProps {
  schedule: ScheduleItem[];
  bins: BinOpt[];
}

const statusStyles = {
  pending: { bg: "bg-muted", text: "text-muted-foreground", icon: Clock },
  "in-progress": { bg: "bg-info/10", text: "text-info", icon: Truck },
  completed: { bg: "bg-primary/10", text: "text-primary", icon: CheckCircle },
  overdue: { bg: "bg-destructive/10", text: "text-destructive", icon: AlertCircle },
};

const priorityStyles = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

export function CollectionSchedule({ schedule, bins }: CollectionScheduleProps) {
  const { user, isAdmin, isPersonnel, canControlBin } = useAuth();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // create form
  const [binId, setBinId] = useState(bins[0]?.id ?? "");
  const [when, setWhen] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [estFill, setEstFill] = useState("80");
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (!binId || !when) { toast.error("Bin and date/time required"); return; }
    if (!canControlBin(binId)) { toast.error("Not assigned to this bin"); return; }
    setCreating(true);
    const { error } = await supabase.from("schedule").insert({
      bin_id: binId,
      scheduled_time: new Date(when).toISOString(),
      priority,
      estimated_fill: Number(estFill) || null,
      status: "pending",
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pickup scheduled");
    setOpen(false); setWhen(""); setEstFill("80");
  };

  const markComplete = async (item: ScheduleItem) => {
    if (!isAdmin && !canControlBin(item.binId)) {
      toast.error("Not assigned to this bin"); return;
    }
    setBusyId(item.id);
    const { error } = await supabase.from("schedule").update({
      status: "completed",
      completed_by: user?.id,
      completed_at: new Date().toISOString(),
    }).eq("id", item.id);
    if (!error) {
      await supabase.from("activities").insert({
        bin_id: item.binId, type: "collection", message: `Pickup completed for ${item.binName}`,
      });
    }
    setBusyId(null);
    if (error) toast.error(error.message);
    else toast.success("Marked complete");
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Collection Schedule
        </CardTitle>
        {(isAdmin || isPersonnel) && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Truck className="h-4 w-4" /> Schedule Collection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Schedule a pickup</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Bin</Label>
                  <Select value={binId} onValueChange={setBinId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {bins.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Date & time</Label><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as "low" | "medium" | "high")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Estimated fill (%)</Label><Input type="number" min="0" max="100" value={estFill} onChange={(e) => setEstFill(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>Cancel</Button>
                <Button onClick={create} disabled={creating}>
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[350px] overflow-y-auto">
          {schedule.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No scheduled pickups.</p>
          )}
          {schedule.map((item) => {
            const StatusIcon = statusStyles[item.status].icon;
            const canComplete = (isAdmin || canControlBin(item.binId)) && item.status !== "completed";
            return (
              <div key={item.id} className={`p-4 rounded-lg border ${statusStyles[item.status].bg}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`h-4 w-4 ${statusStyles[item.status].text}`} />
                    <span className="font-medium">{item.binName}</span>
                    <span className="text-xs text-muted-foreground">({item.binId})</span>
                  </div>
                  <Badge className={priorityStyles[item.priority]}>{item.priority.toUpperCase()}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3 w-3" /><span>{item.location}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3 w-3" /><span>{item.scheduledTime}</span></div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Est. Fill: {item.estimatedFill}%</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={statusStyles[item.status].text}>
                      {item.status.replace("-", " ").toUpperCase()}
                    </Badge>
                    {canComplete && (
                      <Button size="sm" variant="outline" disabled={busyId === item.id} onClick={() => markComplete(item)} className="h-7">
                        {busyId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                        Mark done
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

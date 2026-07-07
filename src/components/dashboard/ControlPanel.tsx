import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Unlock, Settings, ShieldAlert, DoorOpen, DoorClosed, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ControlPanelProps {
  bins: Array<{ id: string; name: string; lid_status?: string }>;
}

export function ControlPanel({ bins }: ControlPanelProps) {
  const { user, isAdmin, assignedBinIds, loading, roles } = useAuth();
  const [selectedBin, setSelectedBin] = useState(bins[0]?.id || "");
  const [busy, setBusy] = useState<string | null>(null);

  const allowed = useMemo(
    () => isAdmin || assignedBinIds.includes(selectedBin),
    [selectedBin, isAdmin, assignedBinIds]
  );

  // Hide the read-only banner until auth has resolved roles
  const rolesResolved = !loading && roles.length > 0;
  const currentLid = bins.find((b) => b.id === selectedBin)?.lid_status ?? "closed";

  const send = async (command: string, label: string) => {
    if (!allowed) { toast.error("You are not assigned to this bin."); return; }
    setBusy(command);
    const { error } = await supabase.from("control_commands").insert({
      bin_id: selectedBin, command, issued_by: user?.id,
    });
    // Activity feed row is now written automatically by a DB trigger on control_commands.
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success(`${label} sent — ESP32 will pick it up on next poll`);
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Smart Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Select Bin</Label>
          <Select value={selectedBin} onValueChange={setSelectedBin}>
            <SelectTrigger><SelectValue placeholder="Select a bin" /></SelectTrigger>
            <SelectContent>
              {bins.map((bin) => (
                <SelectItem key={bin.id} value={bin.id}>{bin.name} ({bin.id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {rolesResolved && !allowed && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Read-only — you are not assigned to this bin.</span>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm">Lid Actions <span className="text-xs text-muted-foreground">(currently {currentLid})</span></Label>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" disabled={!allowed || busy !== null} onClick={() => send("open_lid", "Open lid")} className="gap-2">
              {busy === "open_lid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoorOpen className="h-4 w-4" />} Open
            </Button>
            <Button size="sm" variant="outline" disabled={!allowed || busy !== null} onClick={() => send("close_lid", "Close lid")} className="gap-2">
              {busy === "close_lid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <DoorClosed className="h-4 w-4" />} Close
            </Button>
            <Button size="sm" variant="outline" disabled={!allowed || busy !== null} onClick={() => send("lock_lid", "Lock lid")} className="gap-2">
              {busy === "lock_lid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Lock
            </Button>
            <Button size="sm" variant="outline" disabled={!allowed || busy !== null} onClick={() => send("unlock_lid", "Unlock lid")} className="gap-2">
              {busy === "unlock_lid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />} Unlock
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm">Maintenance</Label>
          <Button size="sm" variant="destructive" disabled={!allowed || busy !== null} onClick={() => send("reset_bin", "Reset bin")} className="gap-2 w-full">
            {busy === "reset_bin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Reset Bin
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

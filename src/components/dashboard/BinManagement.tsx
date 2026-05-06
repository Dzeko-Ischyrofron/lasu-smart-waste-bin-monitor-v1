import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, KeyRound, Copy } from "lucide-react";

interface BinRow {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  is_online: boolean;
}

export function BinManagement() {
  const { isAdmin } = useAuth();
  const [bins, setBins] = useState<BinRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ id: "", name: "", location: "", latitude: "", longitude: "" });

  const [revealedKey, setRevealedKey] = useState<{ id: string; key: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("bins").select("id, name, location, latitude, longitude, is_online").order("name");
    setBins(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const create = async () => {
    if (!form.id.trim() || !form.name.trim() || !form.location.trim()) {
      toast.error("ID, name and location are required"); return;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(form.id)) {
      toast.error("ID must be alphanumeric (letters, numbers, dash, underscore)"); return;
    }
    setCreating(true);
    const { error } = await supabase.from("bins").insert({
      id: form.id.trim(),
      name: form.name.trim(),
      location: form.location.trim(),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    });
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Bin registered");
    setOpen(false);
    setForm({ id: "", name: "", location: "", latitude: "", longitude: "" });
    load();
  };

  const updateCoords = async (id: string, lat: string, lng: string) => {
    const { error } = await supabase.from("bins").update({
      latitude: lat ? Number(lat) : null,
      longitude: lng ? Number(lng) : null,
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Location updated");
    load();
  };

  const revealKey = async (id: string) => {
    const { data, error } = await supabase.rpc("get_bin_device_key", { _bin_id: id });
    if (error) { toast.error(error.message); return; }
    if (!data) { toast.error("No key found"); return; }
    setRevealedKey({ id, key: data as string });
  };

  const rotateKey = async (id: string) => {
    if (!confirm("Rotate device API key? The ESP32 must be reflashed with the new key.")) return;
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const key = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("bins").update({ device_api_key: key }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Key rotated");
    setRevealedKey({ id, key });
    load();
  };

  if (!isAdmin) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Bin Management</CardTitle>
          <CardDescription>Register ESP32-powered bins, set map coordinates, and manage device API keys.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add bin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register a new bin</DialogTitle>
              <DialogDescription>The bin ID is used by the ESP32 firmware to identify itself.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Bin ID (e.g. BIN-002)</Label><Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="BIN-002" /></div>
              <div className="space-y-2"><Label>Display name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="LASU EPE-ECE 2" /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Engineering Block A" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2"><Label>Latitude (optional)</Label><Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="6.5908" /></div>
                <div className="space-y-2"><Label>Longitude (optional)</Label><Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="3.9817" /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>Cancel</Button>
              <Button onClick={create} disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead>Device key</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bins.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.id} — {b.location}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.is_online ? "default" : "secondary"}>{b.is_online ? "Online" : "Offline"}</Badge>
                  </TableCell>
                  <TableCell>
                    <CoordEditor bin={b} onSave={updateCoords} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {showKeyFor === b.id ? (
                        <>
                          <code className="text-xs bg-muted px-2 py-1 rounded max-w-[180px] truncate">{b.device_api_key}</code>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { navigator.clipboard.writeText(b.device_api_key); toast.success("Copied"); }}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setShowKeyFor(b.id)} className="gap-1 h-7">
                          <KeyRound className="h-3 w-3" /> Show
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => rotateKey(b.id)} className="h-7 text-xs">Rotate</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {bins.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No bins registered.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function CoordEditor({ bin, onSave }: { bin: BinRow; onSave: (id: string, lat: string, lng: string) => void }) {
  const [lat, setLat] = useState(bin.latitude?.toString() ?? "");
  const [lng, setLng] = useState(bin.longitude?.toString() ?? "");
  const dirty = lat !== (bin.latitude?.toString() ?? "") || lng !== (bin.longitude?.toString() ?? "");
  return (
    <div className="flex items-center gap-1">
      <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="lat" className="h-7 w-20 text-xs" />
      <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="lng" className="h-7 w-20 text-xs" />
      {dirty && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSave(bin.id, lat, lng)}>Save</Button>}
    </div>
  );
}

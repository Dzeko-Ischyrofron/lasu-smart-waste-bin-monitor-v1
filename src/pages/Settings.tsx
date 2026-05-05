import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/dashboard/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { BinManagement } from "@/components/dashboard/BinManagement";

type AppRole = "admin" | "viewer" | "personnel";

interface BinRow { id: string; name: string; location: string; }
interface UserRow {
  id: string;
  display_name: string | null;
  role: AppRole;
  bin_ids: string[];
}

const nameSchema = z.string().trim().min(1).max(100);

export default function Settings() {
  const { user, isAdmin, roles, refreshAssignments } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [bins, setBins] = useState<BinRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Add user dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<AppRole>("personnel");
  const [addBinIds, setAddBinIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setDisplayName(data.display_name ?? ""); });
  }, [user]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    setLoadingUsers(true);
    const [{ data: profs }, { data: rolesData }, { data: binsData }, { data: assigns }] = await Promise.all([
      supabase.from("profiles").select("id, display_name"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("bins").select("id, name, location").order("name"),
      supabase.from("bin_assignments").select("user_id, bin_id"),
    ]);
    const map = new Map<string, UserRow>();
    profs?.forEach((p) => map.set(p.id, { id: p.id, display_name: p.display_name, role: "viewer", bin_ids: [] }));
    rolesData?.forEach((r) => {
      const u = map.get(r.user_id);
      if (u) u.role = r.role as AppRole;
    });
    assigns?.forEach((a) => {
      const u = map.get(a.user_id);
      if (u) u.bin_ids.push(a.bin_id);
    });
    setUsers(Array.from(map.values()));
    setBins(binsData ?? []);
    setLoadingUsers(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    try { nameSchema.parse(displayName); } catch { toast.error("Display name required"); return; }
    setSavingProfile(true);
    const { error } = await supabase.from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) toast.error(error.message);
    else { toast.success("Password changed"); setNewPassword(""); }
  };

  const changeRole = async (userId: string, newRole: AppRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    if (error) { toast.error(error.message); return; }
    toast.success("Role updated");
    loadAll();
  };

  const toggleBin = async (userId: string, binId: string, assigned: boolean) => {
    if (assigned) {
      const { error } = await supabase.from("bin_assignments").delete()
        .eq("user_id", userId).eq("bin_id", binId);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("bin_assignments").insert({ user_id: userId, bin_id: binId });
      if (error) { toast.error(error.message); return; }
    }
    if (userId === user?.id) await refreshAssignments();
    loadAll();
  };

  const createUser = async () => {
    if (!addEmail || addPassword.length < 6) { toast.error("Email + 6+ char password required"); return; }
    setCreating(true);
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { email: addEmail, password: addPassword, display_name: addName, role: addRole, bin_ids: addBinIds },
    });
    setCreating(false);
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed");
      return;
    }
    toast.success("User created");
    setAddOpen(false);
    setAddEmail(""); setAddPassword(""); setAddName(""); setAddRole("personnel"); setAddBinIds([]);
    loadAll();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm("Delete this user? This cannot be undone.")) return;
    const { data, error } = await supabase.functions.invoke("admin-delete-user", { body: { user_id: userId } });
    if (error || (data as { error?: string })?.error) {
      toast.error((data as { error?: string })?.error ?? error?.message ?? "Failed");
      return;
    }
    toast.success("User deleted");
    loadAll();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 space-y-6 max-w-5xl">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to dashboard
        </Link>

        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account{isAdmin ? ", users, and bin assignments" : " and preferences"}.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details. Role: <Badge variant="secondary" className="capitalize ml-1">{roles[0] ?? "viewer"}</Badge></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
            <div className="space-y-2"><Label htmlFor="dn">Display name</Label><Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Change password</CardTitle><CardDescription>At least 6 characters.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label htmlFor="np">New password</Label><Input id="np" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
            <Button onClick={changePassword} disabled={savingPassword || !newPassword}>
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
            </Button>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Team, Roles & Bin Assignments</CardTitle>
                <CardDescription>
                  Admins control everything. Personnel can control only the bins they're assigned to. Viewers are read-only.
                </CardDescription>
              </div>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add user</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create user account</DialogTitle>
                    <DialogDescription>Issue an account and assign bins. The user can sign in immediately with the password you set.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Email</Label><Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Display name</Label><Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. ECE Personnel" /></div>
                    <div className="space-y-2"><Label>Temporary password</Label><Input type="text" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Min 6 characters" /></div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={addRole} onValueChange={(v) => setAddRole(v as AppRole)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="personnel">Personnel</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Assigned bins {addRole === "admin" && <span className="text-xs text-muted-foreground">(admins control all bins anyway)</span>}</Label>
                      <div className="space-y-2 max-h-40 overflow-auto rounded border p-2">
                        {bins.length === 0 && <p className="text-xs text-muted-foreground">No bins yet.</p>}
                        {bins.map((b) => (
                          <label key={b.id} className="flex items-center gap-2 text-sm">
                            <Checkbox
                              checked={addBinIds.includes(b.id)}
                              onCheckedChange={(c) => setAddBinIds(c ? [...addBinIds, b.id] : addBinIds.filter((x) => x !== b.id))}
                            />
                            <span>{b.name} <span className="text-xs text-muted-foreground">({b.id})</span></span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddOpen(false)} disabled={creating}>Cancel</Button>
                    <Button onClick={createUser} disabled={creating}>
                      {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create user"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingUsers ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Assigned bins</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          {u.display_name ?? "—"}
                          {u.id === user?.id && <span className="text-xs text-muted-foreground ml-2">(you)</span>}
                        </TableCell>
                        <TableCell>
                          <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as AppRole)} disabled={u.id === user?.id}>
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="personnel">Personnel</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {bins.map((b) => {
                              const assigned = u.bin_ids.includes(b.id);
                              return (
                                <button
                                  key={b.id}
                                  onClick={() => toggleBin(u.id, b.id, assigned)}
                                  className={`text-xs px-2 py-1 rounded border transition ${assigned ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
                                  title={assigned ? "Click to unassign" : "Click to assign"}
                                >
                                  {b.name}
                                </button>
                              );
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.id !== user?.id && (
                            <Button size="icon" variant="ghost" onClick={() => deleteUser(u.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {isAdmin && <BinManagement />}
      </main>
    </div>
  );
}

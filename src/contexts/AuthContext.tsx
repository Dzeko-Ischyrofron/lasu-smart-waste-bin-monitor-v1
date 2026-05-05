import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "viewer" | "personnel";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  assignedBinIds: string[];
  loading: boolean;
  isAdmin: boolean;
  isPersonnel: boolean;
  canControlBin: (binId: string) => boolean;
  refreshAssignments: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [assignedBinIds, setAssignedBinIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setTimeout(() => {
          fetchRoles(newSession.user.id);
          fetchAssignments(newSession.user.id);
        }, 0);
      } else {
        setRoles([]);
        setAssignedBinIds([]);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: existing } }) => {
      setSession(existing);
      setUser(existing?.user ?? null);
      if (existing?.user) {
        await Promise.all([fetchRoles(existing.user.id), fetchAssignments(existing.user.id)]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRoles = async (userId: string, attempt = 0) => {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (error) {
      console.error("fetchRoles error", error);
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        return fetchRoles(userId, attempt + 1);
      }
      return;
    }
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  const fetchAssignments = async (userId: string, attempt = 0) => {
    const { data, error } = await supabase.from("bin_assignments").select("bin_id").eq("user_id", userId);
    if (error) {
      console.error("fetchAssignments error", error);
      if (attempt < 4) {
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        return fetchAssignments(userId, attempt + 1);
      }
      return;
    }
    setAssignedBinIds((data ?? []).map((r) => r.bin_id));
  };

  const refreshAssignments = async () => {
    if (user) await fetchAssignments(user.id);
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const isAdmin = roles.includes("admin");
  const isPersonnel = roles.includes("personnel");

  const canControlBin = (binId: string) => isAdmin || (isPersonnel && assignedBinIds.includes(binId));

  const value: AuthContextValue = {
    user, session, roles, assignedBinIds, loading,
    isAdmin, isPersonnel, canControlBin, refreshAssignments, signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


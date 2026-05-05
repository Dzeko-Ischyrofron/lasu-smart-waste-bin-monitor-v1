import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AppRole = "admin" | "personnel" | "viewer";

interface Body {
  email: string;
  password: string;
  display_name?: string;
  role: AppRole;
  bin_ids?: string[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub;

    // verify caller is admin
    const admin = createClient(url, service);
    const { data: roleRows } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin");
    if (!roleRows?.length) return json({ error: "Forbidden — admins only" }, 403);

    const body: Body = await req.json();
    const { email, password, display_name, role, bin_ids } = body;

    if (!email || !password || !role) {
      return json({ error: "email, password, role required" }, 400);
    }
    if (password.length < 6) return json({ error: "Password must be 6+ chars" }, 400);

    // Create user (auto-confirmed)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: display_name ?? email.split("@")[0] },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "Could not create user" }, 400);
    }
    const newUserId = created.user.id;

    // Override default role from handle_new_user trigger
    await admin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await admin
      .from("user_roles")
      .insert({ user_id: newUserId, role });
    if (roleErr) return json({ error: roleErr.message }, 400);

    // Assign bins
    if (bin_ids?.length) {
      const rows = bin_ids.map((bin_id) => ({ bin_id, user_id: newUserId }));
      const { error: assignErr } = await admin.from("bin_assignments").insert(rows);
      if (assignErr) return json({ error: assignErr.message }, 400);
    }

    return json({ ok: true, user_id: newUserId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

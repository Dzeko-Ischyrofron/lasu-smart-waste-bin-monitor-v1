// ESP32 device endpoint: ingest sensor readings + return queued commands.
// Auth: header "x-device-key" must match bins.device_api_key for the bin.
// No JWT required — devices use their per-bin API key.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface IngestPayload {
  bin_id: string;
  fill_percent?: number;
  ultrasonic_cm?: number;
  ir_sensor?: boolean;
  mq135_ppm?: number;
  servo_angle?: number;
  battery?: number;
  signal_strength?: number;
  lid_status?: "open" | "closed";
  is_online?: boolean;
}

function num(v: unknown, lo: number, hi: number): number | null {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.max(lo, Math.min(hi, n));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const deviceKey = req.headers.get("x-device-key");
    if (!deviceKey) {
      return new Response(JSON.stringify({ error: "Missing x-device-key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as IngestPayload;
    if (!body.bin_id || typeof body.bin_id !== "string") {
      return new Response(JSON.stringify({ error: "bin_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify device key matches the bin
    const { data: bin, error: binErr } = await supabase
      .from("bins")
      .select("id, device_api_key, fill_level")
      .eq("id", body.bin_id)
      .maybeSingle();

    if (binErr || !bin) {
      return new Response(JSON.stringify({ error: "Bin not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (bin.device_api_key !== deviceKey) {
      return new Response(JSON.stringify({ error: "Invalid device key" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs
    const fill = num(body.fill_percent, 0, 100);
    const battery = num(body.battery, 0, 100);
    const mq = num(body.mq135_ppm, 0, 10000);
    const ultrasonic = num(body.ultrasonic_cm, 0, 1000);
    const servo = num(body.servo_angle, 0, 180);
    const signal = num(body.signal_strength, 0, 100);
    const lid = body.lid_status === "open" || body.lid_status === "closed" ? body.lid_status : null;

    // Insert sensor reading (time-series)
    await supabase.from("sensor_readings").insert({
      bin_id: bin.id,
      ultrasonic_cm: ultrasonic,
      fill_percent: fill,
      ir_sensor: typeof body.ir_sensor === "boolean" ? body.ir_sensor : null,
      mq135_ppm: mq,
      servo_angle: servo,
      battery,
      signal_strength: signal,
    });

    // Update bin current state
    const odorLevel = mq === null ? null : mq > 300 ? "high" : mq > 150 ? "moderate" : "normal";
    const update: Record<string, unknown> = {
      is_online: true,
      last_update: new Date().toISOString(),
    };
    if (fill !== null) update.fill_level = fill;
    if (battery !== null) update.battery = battery;
    if (lid) update.lid_status = lid;
    if (odorLevel) update.odor_level = odorLevel;
    if (typeof body.ir_sensor === "boolean") update.hand_detected = body.ir_sensor;

    await supabase.from("bins").update(update).eq("id", bin.id);

    // Auto-generate alerts on threshold crossings
    if (fill !== null && fill >= 80 && bin.fill_level < 80) {
      await supabase.from("alerts").insert({
        bin_id: bin.id, type: "critical", category: "fill",
        message: `Bin reached ${fill}% capacity`,
      });
      await supabase.from("activities").insert({
        bin_id: bin.id, type: "fill", message: `Fill level reached ${fill}%`,
      });
    }
    if (battery !== null && battery < 25) {
      await supabase.from("alerts").insert({
        bin_id: bin.id, type: "warning", category: "battery",
        message: `Battery at ${battery}% — recharge soon`,
      });
    }
    if (mq !== null && mq > 300) {
      await supabase.from("alerts").insert({
        bin_id: bin.id, type: "critical", category: "odor",
        message: `Critical odor level (${mq} ppm) — immediate attention required`,
      });
    }

    // Return any pending commands for the device to execute
    const { data: cmds } = await supabase
      .from("control_commands")
      .select("id, command, payload")
      .eq("bin_id", bin.id)
      .eq("executed", false)
      .order("created_at", { ascending: true })
      .limit(10);

    // Mark them executed
    if (cmds && cmds.length > 0) {
      await supabase
        .from("control_commands")
        .update({ executed: true, executed_at: new Date().toISOString() })
        .in("id", cmds.map((c) => c.id));
    }

    return new Response(JSON.stringify({ ok: true, commands: cmds ?? [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("device-ingest error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

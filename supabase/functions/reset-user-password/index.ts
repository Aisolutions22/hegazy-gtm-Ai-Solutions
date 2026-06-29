// Reset another user's password (staff-only).
// Verifies the caller via their JWT, confirms staff role server-side,
// then uses the Service Role key (server-side only) to update the target user's password.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Missing Authorization" }, 401);

  // Identify caller using anon client + their JWT
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await callerClient.auth.getUser();
  if (userErr || !userData?.user) return json({ error: "Invalid session" }, 401);
  const callerId = userData.user.id;

  // Server-side staff check (the real security boundary)
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  const { data: roleRow, error: roleErr } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", callerId)
    .maybeSingle();
  if (roleErr) return json({ error: roleErr.message }, 500);
  const role = roleRow?.role as string | undefined;
  if (role !== "owner" && role !== "admin") {
    return json({ error: "Forbidden" }, 403);
  }

  let body: { target_user_id?: string; new_password?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const target = body.target_user_id?.trim();
  const newPassword = body.new_password ?? "";
  if (!target) return json({ error: "target_user_id is required" }, 400);
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return json({ error: "Password must be at least 8 characters" }, 400);
  }

  const { error: updErr } = await admin.auth.admin.updateUserById(target, {
    password: newPassword,
  });
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ ok: true });
});

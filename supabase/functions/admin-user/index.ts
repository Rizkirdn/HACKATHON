import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const anon = Deno.env.get("SUPABASE_ANON_KEY");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !anon || !service) return json({ error: "Supabase secrets belum lengkap" }, 500);
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Unauthorized" }, 401);
    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: auth } },
    });
    const admin = createClient(url, service);
    const {
      data: { user: actor },
    } = await userClient.auth.getUser();
    if (!actor) return json({ error: "Unauthorized" }, 401);
    const { data: actorProfile } = await admin
      .from("profiles")
      .select("role,active")
      .eq("id", actor.id)
      .single();
    if (!actorProfile?.active || !["owner", "admin"].includes(actorProfile.role))
      return json({ error: "Forbidden" }, 403);

    const body = await req.json();
    const actorRole = actorProfile.role as "owner" | "admin";
    if (actorRole === "admin" && body.action === "create" && body.role !== "kasir")
      return json({ error: "Admin hanya dapat membuat akun kasir" }, 403);
    if (body.action === "delete") {
      if (!body.id) return json({ error: "id wajib diisi" }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.id);
      if (error) throw error;
      return json({ ok: true });
    }
    if (body.action !== "create") return json({ error: "action tidak valid" }, 400);
    if (body.role !== "admin" && body.role !== "kasir")
      return json({ error: "Role hanya boleh admin atau kasir" }, 400);
    if (!body.username || !body.password || !body.name || !body.role)
      return json({ error: "name, username, password, role wajib diisi" }, 400);
    const username = String(body.username).trim();
    if (String(body.password).length < 8)
      return json({ error: "Password minimal 8 karakter" }, 400);
    const email = username.includes("@")
      ? username.toLowerCase()
      : `${username.toLowerCase()}@kasircimol.local`;
    const created = await admin.auth.admin.createUser({
      email,
      password: body.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) throw created.error ?? new Error("User gagal dibuat");
    const id = created.data.user.id;
    const { error: profileError } = await admin
      .from("profiles")
      .insert({ id, name: String(body.name).trim(), username, role: body.role, active: true });
    if (profileError) {
      await admin.auth.admin.deleteUser(id);
      throw profileError;
    }
    const branches = Array.isArray(body.branchIds)
      ? [
          ...new Set(
            body.branchIds.filter(
              (branch_id: unknown): branch_id is string => typeof branch_id === "string",
            ),
          ),
        ]
      : [];
    if (!branches.length) {
      await admin.from("profiles").delete().eq("id", id);
      await admin.auth.admin.deleteUser(id);
      return json({ error: "Minimal satu cabang wajib dipilih" }, 400);
    }
    const { data: validBranches, error: branchLookupError } = await admin
      .from("branches")
      .select("id")
      .in("id", branches);
    if (branchLookupError) throw branchLookupError;
    if ((validBranches ?? []).length !== branches.length) {
      await admin.from("profiles").delete().eq("id", id);
      await admin.auth.admin.deleteUser(id);
      return json({ error: "Cabang tidak valid" }, 400);
    }
    const { error } = await admin
      .from("profile_branches")
      .insert(branches.map((branch_id: string) => ({ profile_id: id, branch_id })));
    if (error) {
      await admin.from("profiles").delete().eq("id", id);
      await admin.auth.admin.deleteUser(id);
      throw error;
    }
    return json({ id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});

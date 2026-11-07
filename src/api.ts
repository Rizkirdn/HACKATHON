import { supabase } from "./supabase";
import type { Belanja, Branch, Produk, Stok, Trx, User } from "./store";

const requireSupabase = () => {
  if (!supabase) throw new Error("Supabase belum dikonfigurasi");
  return supabase;
};

export async function loadRemote() {
  const client = requireSupabase();
  const [products, spices, stock, purchases, transactions, profiles, branches] = await Promise.all([
    client.from("products").select("*"),
    client.from("spices").select("name"),
    client.from("stock_items").select("*"),
    client.from("purchases").select("*").order("created_at", { ascending: false }),
    client.from("transactions").select("*").order("occurred_at", { ascending: false }),
    client.from("profiles").select("id,name,username,role,active,profile_branches(branch_id)"),
    client.from("branches").select("id,code,name,address,multiplier"),
  ]);
  const error = [products, spices, stock, purchases, transactions, branches].find(
    (x) => x.error,
  )?.error;
  if (error) throw error;
  const profileNames = new Map(
    (profiles.data ?? []).map((profile) => [profile.id, profile.name] as const),
  );
  return {
    produk: (products.data ?? []).map(
      (x) =>
        ({
          id: x.id,
          nama: x.name,
          tipe: x.type,
          porsi: x.portions ?? undefined,
          harga: x.price ?? undefined,
          tone: x.tone,
        }) as Produk,
    ),
    bumbu: (spices.data ?? []).map((x) => x.name),
    stok: (stock.data ?? []).map(
      (x) =>
        ({
          id: x.id,
          nama: x.name,
          unit: x.unit,
          hargaUnit: x.unit_price,
          min: x.minimum,
          kategori: x.category,
          qty: x.quantity,
        }) as Stok,
    ),
    belanja: (purchases.data ?? []).map(
      (x) =>
        ({
          id: x.id,
          cabangId: x.branch_id,
          stokId: x.stock_id,
          nama: x.name,
          unit: x.unit,
          qty: x.quantity,
          harga: x.price ?? undefined,
          catatan: x.note,
          status: x.status,
          oleh: x.requested_by
            ? (profileNames.get(x.requested_by) ?? "Pengguna tidak dikenal")
            : "Tidak diketahui",
          olehId: x.requested_by ?? undefined,
          waktu: x.created_at,
        }) as Belanja,
    ),
    trx: (transactions.data ?? []).map(
      (x) =>
        ({
          id: x.id,
          cabangId: x.branch_id,
          nomor: x.number,
          waktu: x.occurred_at,
          total: x.total,
          dibayar: x.paid,
          kasir: x.cashier_id
            ? (profileNames.get(x.cashier_id) ?? "Pengguna tidak dikenal")
            : "Tidak diketahui",
          kasirId: x.cashier_id ?? undefined,
          shift: x.shift,
          status: x.status,
          metode: x.method,
          items: x.items,
          voidAlasan: x.void_reason ?? undefined,
        }) as Trx,
    ),
    branches: (branches.data ?? []).map(
      (x) =>
        ({
          id: x.id,
          kode: x.code,
          nama: x.name,
          alamat: x.address,
          mult: Number(x.multiplier),
        }) as Branch,
    ),
    users: (profiles.data ?? []).map(
      (x) =>
        ({
          id: x.id,
          nama: x.name,
          username: x.username,
          role: x.role,
          aktif: x.active,
          cabang: (x.profile_branches ?? []).map((b: { branch_id: string }) => b.branch_id),
        }) as User,
    ),
  };
}

export async function upsertRemote(table: string, payload: Record<string, unknown>) {
  const client = requireSupabase();
  const { error } = await client.from(table).upsert(payload);
  if (error) throw error;
}

export async function deleteRemote(table: string, id: string) {
  const client = requireSupabase();
  const { error } = await client.from(table).delete().eq("id", id);
  if (error) throw error;
}

export async function callAdminUser(action: "create" | "delete", payload: Record<string, unknown>) {
  const client = requireSupabase();
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (sessionError || !accessToken) throw new Error("Sesi owner tidak aktif. Login ulang.");
  const { data, error } = await client.functions.invoke("admin-user", {
    body: { action, ...payload },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (error) {
    const context = "context" in error ? (error as { context?: unknown }).context : undefined;
    if (context && typeof context === "object") {
      const response = context as {
        json?: () => Promise<unknown>;
        text?: () => Promise<string>;
      };
      const detail =
        typeof response.json === "function"
          ? await response.json().catch(() => null)
          : typeof response.text === "function"
            ? await response.text().catch(() => "")
            : null;
      if (detail && typeof detail === "object" && "error" in detail) {
        throw new Error(String((detail as { error: unknown }).error));
      }
      if (typeof detail === "string" && detail) throw new Error(detail);
    }
    throw error;
  }
  return data;
}

export async function updateProfile(id: string, payload: Record<string, unknown>) {
  const { error } = await requireSupabase().from("profiles").update(payload).eq("id", id);
  if (error) throw error;
}

export async function setProfileBranches(profileId: string, branches: string[]) {
  const db = requireSupabase();
  const { error: removeError } = await db
    .from("profile_branches")
    .delete()
    .eq("profile_id", profileId);
  if (removeError) throw removeError;
  if (!branches.length) return;
  const { error } = await db
    .from("profile_branches")
    .insert(branches.map((branch_id) => ({ profile_id: profileId, branch_id })));
  if (error) throw error;
}

export const remoteRow = {
  product: (x: Produk) => ({
    id: x.id,
    name: x.nama,
    type: x.tipe,
    portions: x.porsi ?? null,
    price: x.harga ?? null,
    tone: x.tone,
  }),
  spice: (name: string) => ({ name }),
  stock: (x: Stok, branchId: string) => ({
    id: x.id,
    branch_id: branchId,
    name: x.nama,
    unit: x.unit,
    unit_price: x.hargaUnit,
    minimum: x.min,
    category: x.kategori,
    quantity: x.qty,
    updated_at: new Date().toISOString(),
  }),
  purchase: (x: Belanja, branchId: string, actorId?: string | null) => ({
    id: x.id,
    branch_id: x.cabangId || branchId,
    stock_id: x.stokId,
    name: x.nama,
    unit: x.unit,
    quantity: x.qty,
    price: x.harga ?? null,
    note: x.catatan,
    status: x.status,
    requested_by: actorId ?? null,
    created_at: x.waktu,
  }),
  transaction: (x: Trx, branchId: string, actorId?: string | null) => ({
    id: x.id,
    branch_id: x.cabangId || branchId,
    number: x.nomor,
    occurred_at: x.waktu,
    total: x.total,
    paid: x.dibayar,
    cashier_id: actorId ?? null,
    shift: x.shift,
    status: x.status,
    method: x.metode,
    items: x.items,
    void_reason: x.voidAlasan ?? null,
  }),
};

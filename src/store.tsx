import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { db, saveLocal, deleteLocal, pendingSyncJobs, removeSyncJob } from "./db";
import { supabase } from "./supabase";
import {
  loadRemote,
  remoteRow,
  upsertRemote,
  deleteRemote,
  callAdminUser,
  updateProfile,
  setProfileBranches,
} from "./api";

export type Role = "owner" | "admin" | "kasir";
export interface Branch {
  id: string;
  kode: string;
  nama: string;
  alamat: string;
  mult: number;
}
export const CABANG: Branch[] = [
  { id: "c1", kode: "C01", nama: "Cimol Pusat", alamat: "Jl. Braga No. 12, Bandung", mult: 1 },
  { id: "c2", kode: "C02", nama: "Cabang Dago", alamat: "Jl. Ir. H. Juanda No. 88", mult: 0.82 },
  { id: "c3", kode: "C03", nama: "Cabang Buah Batu", alamat: "Jl. Buah Batu No. 140", mult: 0.64 },
];
export const SHIFTS = [
  { id: 1, nama: "Shift 1 - Pagi", jam: "08:00 – 15:00" },
  { id: 2, nama: "Shift 2 - Sore", jam: "15:00 – 22:00" },
];
export interface Produk {
  id: string;
  nama: string;
  tipe: "porsi" | "pcs";
  porsi?: number[];
  harga?: number;
  tone: string;
}
const TONES = [
  "bg-amber-100 text-amber-800",
  "bg-orange-100 text-orange-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
  "bg-sky-100 text-sky-800",
  "bg-violet-100 text-violet-800",
];
export type Metode = "tunai" | "qris";
export interface Cart {
  id: string;
  label: string;
  items: CartItem[];
}

export interface CartItem {
  id: string;
  produk: string;
  nama: string;
  sub: string;
  bumbu: string[];
  harga: number;
  qty: number;
}
export interface Stok {
  id: string;
  nama: string;
  unit: string;
  hargaUnit: number;
  min: number;
  kategori: string;
  qty: number;
}
export interface Belanja {
  id: string;
  cabangId: string;
  stokId: string;
  nama: string;
  unit: string;
  qty: number;
  harga?: number;
  catatan: string;
  status: "pending" | "selesai" | "ditolak";
  oleh: string;
  olehId?: string;
  waktu: string;
}
export interface Trx {
  cabangId: string;
  metode: Metode;
  id: string;
  nomor: string;
  waktu: string;
  total: number;
  dibayar: number;
  kasir: string;
  kasirId?: string;
  shift: number;
  status: "sah" | "void";
  items: { nama: string; sub: string; qty: number; harga: number }[];
  voidAlasan?: string;
}
export interface ShiftState {
  template: number;
  kasAwal: number;
  dibuka: string;
}
export interface User {
  id: string;
  nama: string;
  username: string;
  role: Role;
  cabang: string[];
  aktif: boolean;
}

const now = () => {
  const d = new Date();
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
};
const isoNow = () => new Date().toISOString();
export const formatWib = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};
export const businessDate = (value: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    typeof value === "string" ? new Date(value) : value,
  );
const uid = () => Math.random().toString(36).slice(2, 9);

interface Ctx {
  role: Role | null;
  nama: string;
  profileId: string | null;
  cabangId: string | null;
  semuaCabang: boolean;
  login: (r: Role, username?: string, password?: string) => Promise<void>;
  logout: () => void;
  setCabang: (id: string | null, semua?: boolean) => void;
  online: boolean;
  setOnline: (v: boolean) => void;
  queue: number;
  syncing: boolean;
  syncNow: () => void;
  shift: ShiftState | null;
  openShift: (t: number, kas: number) => void;
  closeShift: () => void;
  forceClose: () => void;
  cart: CartItem[];
  carts: Cart[];
  activeId: string;
  setActive: (id: string) => void;
  newCart: () => void;
  removeCart: (id: string) => void;
  addCart: (i: Omit<CartItem, "id">) => void;
  setQty: (id: string, q: number) => void;
  clearCart: () => void;
  checkout: (dibayar: number, metode: Metode) => Trx;
  produk: Produk[];
  addProduk: (p: Omit<Produk, "id" | "tone">) => void;
  delProduk: (id: string) => void;
  bumbu: string[];
  addBumbu: (b: string) => void;
  delBumbu: (b: string) => void;
  aksesCabang: string[];
  branches: Branch[];
  addBranch: (branch: Omit<Branch, "id">) => Promise<void>;
  trx: Trx[];
  voidTrx: (id: string, alasan: string) => void;
  stok: Stok[];
  saveStok: (s: Partial<Stok> & { id?: string }) => void;
  delStok: (id: string) => void;
  opname: (id: string, fisik: number) => void;
  belanja: Belanja[];
  ajukan: (stokId: string, qty: number, catatan: string) => void;
  editBelanja: (id: string, p: Partial<Belanja>) => void;
  delBelanja: (id: string) => void;
  konfirmasi: (id: string, harga: number) => void;
  tolak: (id: string) => void;
  users: User[];
  toggleUser: (id: string) => void;
  addUser: (u: Omit<User, "id" | "aktif"> & { password: string }) => Promise<void>;
  delUser: (id: string) => void;
  setUserCabang: (id: string, c: string[]) => void;
  toast: string | null;
  say: (m: string) => void;
}
const C = createContext<Ctx>(null as never);
export const useApp = () => useContext(C);

export function Provider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [nama, setNama] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [cabangId, setCabangId] = useState<string | null>(null);
  const [semuaCabang, setSemua] = useState(false);
  const [profileBranchesForSession, setProfileBranchesForSession] = useState<string[]>([]);
  const [online, setOnlineS] = useState(true);
  const [queue, setQueue] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [shift, setShift] = useState<ShiftState | null>(null);
  const [carts, setCarts] = useState<Cart[]>([{ id: "k1", label: "Cust 1", items: [] }]);
  const [activeId, setActiveId] = useState("k1");
  const custN = useRef(1);
  const [produk, setProduk] = useState<Produk[]>([]);
  const [bumbu, setBumbu] = useState<string[]>([]);
  const active = carts.find((c) => c.id === activeId) ?? carts[0];
  const cart = active.items;
  const patchActive = (fn: (i: CartItem[]) => CartItem[]) =>
    setCarts((l) => l.map((c) => (c.id === active.id ? { ...c, items: fn(c.items) } : c)));
  const resetCarts = () => {
    custN.current = 1;
    setCarts([{ id: "k1", label: "Cust 1", items: [] }]);
    setActiveId("k1");
  };
  const [trx, setTrx] = useState<Trx[]>([]);
  const [stok, setStok] = useState<Stok[]>([]);
  const [belanja, setBelanja] = useState<Belanja[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>(CABANG);
  const [toast, setToast] = useState<string | null>(null);
  const persist = async <T extends { id: string }>(
    table: Parameters<typeof saveLocal<T>>[0],
    value: T,
    operation: "upsert" | "delete" = "upsert",
  ) => {
    if (operation === "delete")
      await deleteLocal(table, value.id, online, { table: table.name, operation, payload: value });
    else await saveLocal(table, value, online, { table: table.name, operation, payload: value });
  };
  useEffect(() => {
    let alive = true;
    const local = async () => {
      const [p, s, b, t, u] = await Promise.all([
        db.produk.toArray(),
        db.stok.toArray(),
        db.belanja.toArray(),
        db.trx.toArray(),
        db.users.toArray(),
      ]);
      if (!supabase) {
        if (alive) {
          setProduk(p);
          setStok(s);
          setBelanja(b);
          setTrx(t);
          setUsers(u);
        }
        return;
      }
      try {
        const remote = await loadRemote();
        if (!alive) return;
        setProduk(remote.produk);
        setStok(remote.stok);
        setBelanja(remote.belanja);
        setTrx(remote.trx);
        setUsers(remote.users);
        setBranches(remote.branches);
        await Promise.all([
          db.produk.bulkPut(remote.produk),
          db.stok.bulkPut(remote.stok),
          db.belanja.bulkPut(remote.belanja),
          db.trx.bulkPut(remote.trx),
          db.users.bulkPut(remote.users),
        ]);
      } catch (error) {
        console.error("Supabase load failed; using local cache", error);
        if (alive) {
          setProduk(p);
          setStok(s);
          setBelanja(b);
          setTrx(t);
          setUsers(u);
        }
      }
    };
    void local();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("kasir-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        void loadRemote()
          .then((x) => {
            setTrx(x.trx);
            return db.trx.bulkPut(x.trx);
          })
          .catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "stock_items" }, () => {
        void loadRemote()
          .then((x) => {
            setStok(x.stok);
            return db.stok.bulkPut(x.stok);
          })
          .catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "purchases" }, () => {
        void loadRemote()
          .then((x) => {
            setBelanja(x.belanja);
            return db.belanja.bulkPut(x.belanja);
          })
          .catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void loadRemote()
          .then((x) => {
            setProduk(x.produk);
            return db.produk.bulkPut(x.produk);
          })
          .catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void loadRemote()
          .then((x) => {
            setUsers(x.users);
            return db.users.bulkPut(x.users);
          })
          .catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profile_branches" }, () => {
        void loadRemote()
          .then((x) => {
            setUsers(x.users);
            return db.users.bulkPut(x.users);
          })
          .catch(console.error);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => {
        void loadRemote()
          .then((x) => setBranches(x.branches))
          .catch(console.error);
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
  const tm = useRef<number | undefined>(undefined);

  const say = (m: string) => {
    setToast(m);
    window.clearTimeout(tm.current);
    tm.current = window.setTimeout(() => setToast(null), 2400);
  };
  const bump = () => {
    void pendingSyncJobs().then((jobs) => setQueue(jobs.length));
  };
  const syncNow = () => {
    if (!online || !supabase)
      return say(!online ? "Tidak ada koneksi internet" : "Supabase belum dikonfigurasi");
    setSyncing(true);
    void pendingSyncJobs().then(async (jobs) => {
      for (const job of jobs) {
        try {
          if (job.operation === "delete")
            await deleteRemote(job.table, String((job.payload as { id: string }).id));
          else {
            const p = job.payload as any;
            const remote =
              job.table === "products"
                ? remoteRow.product(p)
                : job.table === "stock_items"
                  ? remoteRow.stock(p, cabangId ?? "c1")
                  : job.table === "purchases"
                    ? remoteRow.purchase(p, cabangId ?? "c1", profileId)
                    : job.table === "transactions"
                      ? remoteRow.transaction(p, cabangId ?? "c1", profileId)
                      : p;
            await upsertRemote(job.table, remote);
          }
          if (job.id !== undefined) await removeSyncJob(job.id);
        } catch (error) {
          console.error("Sync job failed", error);
          break;
        }
      }
      const left = await pendingSyncJobs();
      setQueue(left.length);
      setSyncing(false);
      say(
        left.length ? `${left.length} antrean belum tersinkron` : "Antrean tersinkron ke Supabase",
      );
    });
  };
  const setOnline = (v: boolean) => {
    setOnlineS(v);
    if (v) syncNow();
  };
  useEffect(() => {
    const onOnline = () => {
      setOnlineS(true);
      syncNow();
    };
    const onOffline = () => setOnlineS(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [online]);
  useEffect(() => () => window.clearTimeout(tm.current), []);

  const login = async (_requestedRole: Role, username = "", password = "") => {
    if (!supabase) return say("Supabase belum dikonfigurasi");
    const loginValue = username.trim().toLowerCase();
    if (!loginValue || !password) return say("Username/email dan password wajib diisi");
    const email = loginValue.includes("@") ? loginValue : `${loginValue}@kasircimol.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return say(error?.message ?? "Login gagal");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, name, role, active, profile_branches(branch_id)")
      .eq("id", data.user.id)
      .single();
    if (profileError || !profile || !profile.active) {
      await supabase.auth.signOut();
      return say("Akun tidak aktif atau profile belum dibuat");
    }
    const profileBranches = ((profile.profile_branches ?? []) as { branch_id: string }[]).map(
      (branch) => branch.branch_id,
    );
    if (profile.role !== "owner" && !profileBranches.length) {
      await supabase.auth.signOut();
      return say("Akun belum memiliki akses cabang");
    }
    setProfileBranchesForSession(profileBranches);
    setProfileId(data.user.id);
    const remote = await loadRemote();
    setProduk(remote.produk);
    setBumbu(remote.bumbu);
    setStok(remote.stok);
    setBelanja(remote.belanja);
    setTrx(remote.trx);
    setUsers(remote.users);
    setBranches(remote.branches);
    await Promise.all([
      db.produk.clear().then(() => db.produk.bulkPut(remote.produk)),
      db.stok.clear().then(() => db.stok.bulkPut(remote.stok)),
      db.belanja.clear().then(() => db.belanja.bulkPut(remote.belanja)),
      db.trx.clear().then(() => db.trx.bulkPut(remote.trx)),
      db.users.clear().then(() => db.users.bulkPut(remote.users)),
    ]);
    setRole(profile.role as Role);
    setNama(profile.name);
    setCabangId(profile.role === "owner" ? null : (profileBranches[0] ?? null));
    setSemua(profile.role === "owner" || profileBranches.length > 1);
  };
  const aksesCabang =
    role === "owner" ? branches.map((branch) => branch.id) : profileBranchesForSession;
  const logout = () => {
    if (supabase) void supabase.auth.signOut();
    setRole(null);
    setProfileBranchesForSession([]);
    setProfileId(null);
    setNama("");
    setCabangId(null);
    resetCarts();
  };

  const addBranch = async (branch: Omit<Branch, "id">) => {
    if (!supabase) throw new Error("Supabase belum dikonfigurasi");
    const nextNumber =
      branches.reduce((max, current) => {
        const number = Number(current.kode.replace(/\D/g, ""));
        return Number.isFinite(number) ? Math.max(max, number) : max;
      }, 0) + 1;
    const id = `c${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const payload = {
      id,
      code: branch.kode || `C${String(nextNumber).padStart(2, "0")}`,
      name: branch.nama,
      address: branch.alamat,
      multiplier: branch.mult,
    };
    const { error } = await supabase.from("branches").insert(payload);
    if (error) throw new Error(`Supabase cabang: ${error.message}`);
    setBranches((current) => [...current, { ...branch, id, kode: payload.code }]);
    say(`Cabang ${branch.nama} berhasil dibuat`);
  };

  const value: Ctx = {
    role,
    nama,
    profileId,
    cabangId,
    semuaCabang,
    login,
    logout,
    setCabang: (id, semua = false) => {
      setCabangId(id);
      setSemua(semua);
    },
    online,
    setOnline,
    queue,
    syncing,
    syncNow,
    shift,
    openShift: (t, kas) => {
      setShift({ template: t, kasAwal: kas, dibuka: now() });
      bump();
      say(`${SHIFTS[t - 1].nama} dibuka`);
    },
    closeShift: () => {
      setShift(null);
      resetCarts();
      bump();
      say("Shift ditutup");
    },
    forceClose: () => {
      setShift(null);
      say("Shift ditutup paksa dan dicatat di audit log");
    },
    cart,
    carts,
    activeId,
    setActive: setActiveId,
    aksesCabang,
    branches,
    addBranch,
    newCart: () => {
      custN.current += 1;
      const id = uid();
      setCarts((l) => [...l, { id, label: `Cust ${custN.current}`, items: [] }]);
      setActiveId(id);
    },
    removeCart: (id) => {
      const rest = carts.filter((c) => c.id !== id);
      if (!rest.length) return resetCarts();
      setCarts(rest);
      if (id === activeId) setActiveId(rest[0].id);
    },
    addCart: (i) =>
      patchActive((c) => {
        const ex = c.find((x) => x.produk === i.produk && x.nama === i.nama && x.sub === i.sub);
        return ex
          ? c.map((x) => (x === ex ? { ...x, qty: x.qty + i.qty } : x))
          : [...c, { ...i, id: uid() }];
      }),
    setQty: (id, q) =>
      patchActive((c) =>
        q <= 0 ? c.filter((x) => x.id !== id) : c.map((x) => (x.id === id ? { ...x, qty: q } : x)),
      ),
    clearCart: () => patchActive(() => []),
    produk,
    bumbu,
    addProduk: (p) => {
      const next = { ...p, id: uid(), tone: TONES[produk.length % TONES.length] };
      setProduk((l) => [...l, next]);
      void saveLocal(db.produk, next, Boolean(supabase), {
        table: "products",
        operation: "upsert",
        payload: next,
      });
      if (supabase)
        void upsertRemote("products", remoteRow.product(next)).catch((error) =>
          say(`Gagal simpan menu: ${error instanceof Error ? error.message : String(error)}`),
        );
      say(`Menu ${p.nama} ditambahkan`);
    },
    delProduk: (id) => {
      setProduk((l) => l.filter((x) => x.id !== id));
      void deleteLocal(db.produk, id, Boolean(supabase), {
        table: "products",
        operation: "delete",
        payload: { id },
      });
      if (supabase) void deleteRemote("products", id);
      say("Menu dihapus");
    },
    addBumbu: (b) => {
      if (bumbu.some((x) => x.toLowerCase() === b.toLowerCase())) return say("Bumbu sudah ada");
      setBumbu((l) => [...l, b]);
      if (supabase) void upsertRemote("spices", remoteRow.spice(b));
      say(`Bumbu ${b} ditambahkan`);
    },
    delBumbu: (b) => {
      setBumbu((l) => l.filter((x) => x !== b));
      if (supabase) void deleteRemote("spices", b);
      say("Bumbu dihapus");
    },
    checkout: (dibayar, metode) => {
      const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);
      const n = trx.filter((t) => t.shift === (shift?.template ?? 1)).length + 1;
      const t: Trx = {
        cabangId: cabangId ?? "c1",
        id: uid(),
        metode,
        nomor: `${cabangId ?? "ALL"}-S${shift?.template ?? 1}-${String(n).padStart(4, "0")}`,
        waktu: isoNow(),
        total,
        dibayar,
        kasir: nama || "Owner",
        kasirId: profileId ?? undefined,
        shift: shift?.template ?? 1,
        status: "sah",
        items: cart.map((i) => ({ nama: i.nama, sub: i.sub, qty: i.qty, harga: i.harga })),
      };
      setTrx((x) => [t, ...x]);
      void saveLocal(db.trx, t, Boolean(supabase), {
        table: "transactions",
        operation: "upsert",
        payload: t,
      });
      if (supabase)
        void upsertRemote(
          "transactions",
          remoteRow.transaction(t, cabangId ?? "c1", profileId),
        ).catch((e) => say(`Gagal simpan transaksi: ${e.message}`));
      bump();
      if (carts.length > 1) {
        const rest = carts.filter((c) => c.id !== active.id);
        setCarts(rest);
        setActiveId(rest[0].id);
      } else patchActive(() => []);
      return t;
    },
    trx,
    voidTrx: (id, alasan) => {
      const old = trx.find((x) => x.id === id);
      if (!old) return;
      const next = { ...old, status: "void" as const, voidAlasan: alasan };
      setTrx((x) => x.map((t) => (t.id === id ? next : t)));
      void saveLocal(db.trx, next, Boolean(supabase), {
        table: "transactions",
        operation: "upsert",
        payload: next,
      });
      if (supabase)
        void upsertRemote(
          "transactions",
          remoteRow.transaction(next, cabangId ?? "c1", old.kasirId ?? profileId),
        ).catch((error) =>
          say(`Gagal void transaksi: ${error instanceof Error ? error.message : String(error)}`),
        );
      say("Transaksi di-void");
    },
    stok,
    saveStok: (s) => {
      const next = s.id
        ? ({ ...stok.find((x) => x.id === s.id)!, ...s } as Stok)
        : ({
            id: uid(),
            nama: "",
            unit: "kg",
            hargaUnit: 0,
            min: 0,
            kategori: "Lainnya",
            qty: 0,
            ...s,
          } as Stok);
      setStok((l) => (s.id ? l.map((x) => (x.id === s.id ? next : x)) : [...l, next]));
      void saveLocal(db.stok, next, Boolean(supabase), {
        table: "stock_items",
        operation: "upsert",
        payload: next,
      });
      if (supabase)
        void upsertRemote("stock_items", remoteRow.stock(next, cabangId ?? "c1")).catch((error) =>
          say(`Gagal simpan stok: ${error instanceof Error ? error.message : String(error)}`),
        );
      say("Stok disimpan");
    },
    delStok: (id) => {
      setStok((l) => l.filter((x) => x.id !== id));
      void deleteLocal(db.stok, id, Boolean(supabase), {
        table: "stock_items",
        operation: "delete",
        payload: { id },
      });
      if (supabase) void deleteRemote("stock_items", id);
      say("Item dinonaktifkan");
    },
    opname: (id, fisik) => {
      const old = stok.find((x) => x.id === id);
      if (!old) return;
      const next = { ...old, qty: fisik };
      setStok((l) => l.map((x) => (x.id === id ? next : x)));
      void saveLocal(db.stok, next, Boolean(supabase), {
        table: "stock_items",
        operation: "upsert",
        payload: next,
      });
      if (supabase) void upsertRemote("stock_items", remoteRow.stock(next, cabangId ?? "c1"));
      say("Opname tercatat di ledger stok");
    },
    belanja,
    ajukan: (stokId, qty, catatan) => {
      const s = stok.find((x) => x.id === stokId);
      if (!s) return say("Item stok belum tersedia");
      const next = {
        id: uid(),
        cabangId: cabangId ?? "c1",
        stokId,
        nama: s.nama,
        unit: s.unit,
        qty,
        catatan,
        status: "pending" as const,
        oleh: nama || "Owner",
        olehId: profileId ?? undefined,
        waktu: isoNow(),
      };
      setBelanja((b) => [next, ...b]);
      void saveLocal(db.belanja, next, Boolean(supabase), {
        table: "purchases",
        operation: "upsert",
        payload: next,
      });
      if (supabase)
        void upsertRemote("purchases", remoteRow.purchase(next, cabangId ?? "c1", profileId));
      bump();
      say("Pengajuan belanja dikirim");
    },
    editBelanja: (id, p) => {
      const old = belanja.find((x) => x.id === id);
      if (!old) return;
      const next = { ...old, ...p };
      setBelanja((b) => b.map((x) => (x.id === id ? next : x)));
      void saveLocal(db.belanja, next, Boolean(supabase), {
        table: "purchases",
        operation: "upsert",
        payload: next,
      });
      if (supabase)
        void upsertRemote("purchases", remoteRow.purchase(next, cabangId ?? "c1", profileId));
      say("Pengajuan diperbarui");
    },
    delBelanja: (id) => {
      setBelanja((b) => b.filter((x) => x.id !== id));
      void deleteLocal(db.belanja, id, Boolean(supabase), {
        table: "purchases",
        operation: "delete",
        payload: { id },
      });
      if (supabase) void deleteRemote("purchases", id);
      say("Pengajuan dihapus");
    },
    konfirmasi: (id, harga) => {
      const b = belanja.find((x) => x.id === id);
      if (!b) return;
      const next = { ...b, status: "selesai" as const, harga };
      const stock = stok.find((x) => x.id === b.stokId);
      const nextStock = stock ? { ...stock, qty: stock.qty + b.qty } : null;
      setBelanja((l) => l.map((x) => (x.id === id ? next : x)));
      if (nextStock) setStok((l) => l.map((x) => (x.id === b.stokId ? nextStock : x)));
      void saveLocal(db.belanja, next, Boolean(supabase), {
        table: "purchases",
        operation: "upsert",
        payload: next,
      });
      if (supabase)
        void upsertRemote("purchases", remoteRow.purchase(next, cabangId ?? "c1", profileId));
      if (nextStock) {
        void saveLocal(db.stok, nextStock, Boolean(supabase), {
          table: "stock_items",
          operation: "upsert",
          payload: nextStock,
        });
        if (supabase)
          void upsertRemote("stock_items", remoteRow.stock(nextStock, cabangId ?? "c1"));
      }
      say(`Selesai. Stok ${b.nama} +${b.qty} ${b.unit}`);
    },
    tolak: (id) => {
      const b = belanja.find((x) => x.id === id);
      if (!b) return;
      const next = { ...b, status: "ditolak" as const };
      setBelanja((l) => l.map((x) => (x.id === id ? next : x)));
      void saveLocal(db.belanja, next, Boolean(supabase), {
        table: "purchases",
        operation: "upsert",
        payload: next,
      });
      if (supabase)
        void upsertRemote("purchases", remoteRow.purchase(next, cabangId ?? "c1", profileId));
      say("Pengajuan ditolak");
    },
    users,
    toggleUser: (id) => {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      const next = { ...u, aktif: !u.aktif };
      setUsers((l) => l.map((x) => (x.id === id ? next : x)));
      if (supabase) void updateProfile(id, { active: next.aktif });
    },
    addUser: async (u) => {
      if (!supabase) return say("Supabase belum dikonfigurasi");
      if (u.password.length < 8) return say("Password minimal 8 karakter");
      try {
        const result = await callAdminUser("create", {
          name: u.nama,
          username: u.username,
          password: u.password,
          role: u.role,
          branchIds: u.cabang,
        });
        const { password: _password, ...userData } = u;
        const next = { ...userData, id: result.id, aktif: true };
        setUsers((l) => [...l, next]);
        say("Akun dibuat");
      } catch (error) {
        say(`Gagal membuat akun: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
      }
    },
    delUser: (id) => {
      setUsers((u) => u.filter((x) => x.id !== id));
      if (supabase) void callAdminUser("delete", { id });
      say("Pengguna dihapus");
    },
    setUserCabang: (id, c) => {
      setUsers((u) => u.map((x) => (x.id === id ? { ...x, cabang: c } : x)));
      if (supabase) void setProfileBranches(id, c);
      say("Akses cabang diperbarui");
    },
    toast,
    say,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const rp = (n: number) => "Rp " + Math.round(n).toLocaleString("id-ID");
export const statusStok = (s: Stok) => (s.qty <= 0 ? "Habis" : s.qty <= s.min ? "Menipis" : "Aman");

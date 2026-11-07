import { useState } from "react";
import {
  BarChart3,
  Boxes,
  Building2,
  Clock,
  LogOut,
  Pencil,
  Plus,
  ReceiptText,
  Receipt,
  Trash2,
  Users,
  WifiOff,
  Check,
  X,
  ClipboardCheck,
  ChevronDown,
  UtensilsCrossed,
  Tag,
} from "lucide-react";
import { businessDate, formatWib, useApp, rp, SHIFTS, type Stok, type Belanja } from "./store";
import { Btn, Card, Chip, Empty, Field, inputCls, Sheet, StokChip, SyncBadge } from "./ui";
import { TrxDetail } from "./kasir";

type Page = "laporan" | "menu" | "stok" | "belanja" | "transaksi" | "shift" | "pengguna" | "cabang";

export default function AdminApp() {
  const {
    role,
    nama,
    logout,
    cabangId,
    semuaCabang,
    setCabang,
    online,
    setOnline,
    aksesCabang,
    branches,
    belanja,
  } = useApp();
  const [page, setPage] = useState<Page>("laporan");
  const items: { id: Page; l: string; i: typeof Boxes }[] = [
    { id: "laporan", l: "Laporan", i: BarChart3 },
    { id: "stok", l: "Stok bahan", i: Boxes },
    { id: "menu", l: "Menu", i: UtensilsCrossed },
    { id: "belanja", l: "Belanja", i: ReceiptText },
    { id: "transaksi", l: "Transaksi", i: Receipt },
    { id: "shift", l: "Shift", i: Clock },
    ...(role !== "kasir" ? [{ id: "pengguna" as Page, l: "Pengguna", i: Users }] : []),
    ...(role === "owner" ? [{ id: "cabang" as Page, l: "Cabang", i: Building2 }] : []),
  ];
  const label = semuaCabang ? "Semua cabang" : branches.find((c) => c.id === cabangId)?.nama;
  const readOnly = !online;
  return (
    <div className="min-h-screen lg:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-brand-900 p-5 text-white lg:flex">
        <div className="mb-8">
          <p className="text-2xl font-black">Kasir Cimol</p>
          <p className="text-xs text-white/50">
            {role === "owner" ? "Owner" : role === "admin" ? "Admin" : "Kasir"} · {nama}
          </p>
        </div>
        <nav className="flex-1 space-y-1">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => setPage(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${page === t.id ? "bg-white text-brand-900" : "text-white/70 hover:bg-white/10"}`}
            >
              <t.i size={18} />
              {t.l}
              {t.id === "belanja" && belanja.some((item) => item.status === "pending") && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {belanja.filter((item) => item.status === "pending").length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/70 hover:bg-white/10"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </aside>
      <div className="min-w-0 flex-1 pb-24 lg:pb-0">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <p className="text-lg font-black text-brand-700">Kasir Cimol</p>
            </div>
            {role === "owner" || aksesCabang.length > 1 ? (
              <label className="relative flex items-center">
                <Building2
                  size={15}
                  className="pointer-events-none absolute left-3 text-brand-600"
                />
                <select
                  value={semuaCabang ? "all" : (cabangId ?? "")}
                  onChange={(e) =>
                    e.target.value === "all" ? setCabang(null, true) : setCabang(e.target.value)
                  }
                  className="appearance-none rounded-xl bg-brand-50 py-2 pl-9 pr-8 text-sm font-bold text-brand-700"
                >
                  {(role === "owner" || aksesCabang.length > 1) && (
                    <option value="all">
                      {role === "owner" ? "Semua cabang" : "Semua cabang saya"}
                    </option>
                  )}
                  {branches
                    .filter((c) => aksesCabang.includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 text-brand-600"
                />
              </label>
            ) : (
              <Chip tone="blue">{label}</Chip>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnline(!online)}
              className="hidden text-[11px] font-semibold text-slate-400 underline sm:block"
            >
              Simulasi {online ? "offline" : "online"}
            </button>
            <SyncBadge />
            <button
              onClick={logout}
              className="rounded-full bg-slate-100 p-2 text-slate-500 lg:hidden"
              aria-label="Keluar"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        {readOnly && (
          <div className="flex items-center gap-2 bg-amber-100 px-4 py-2.5 text-xs font-semibold text-amber-900 lg:px-8">
            <WifiOff size={14} />
            Mode lihat saja: aksi admin wajib online agar keputusan langsung berlaku.
          </div>
        )}
        <main className="mx-auto max-w-6xl p-4 lg:p-8">
          {page === "laporan" && <Laporan />}
          {page === "menu" && <MenuAdmin ro={readOnly} />}
          {page === "stok" && <StokAdmin ro={readOnly} />}
          {page === "belanja" && <BelanjaAdmin ro={readOnly} />}
          {page === "transaksi" && <TransaksiAdmin ro={readOnly} />}
          {page === "shift" && <ShiftAdmin ro={readOnly} />}
          {page === "pengguna" && <Pengguna ro={readOnly} />}
          {page === "cabang" && <CabangPage />}
        </main>
        <nav className="no-scrollbar fixed bottom-0 left-0 right-0 z-30 flex overflow-x-auto border-t border-slate-200 bg-white lg:hidden">
          {items.map((t) => (
            <button
              key={t.id}
              onClick={() => setPage(t.id)}
              className={`flex min-w-[76px] flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold ${page === t.id ? "text-brand-600" : "text-slate-400"}`}
            >
              <t.i size={20} />
              {t.l}
              {t.id === "belanja" && belanja.some((item) => item.status === "pending") && (
                <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                  {belanja.filter((item) => item.status === "pending").length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

const Title = ({ t, s, children }: { t: string; s?: string; children?: React.ReactNode }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-extrabold lg:text-3xl">{t}</h1>
      {s && <p className="mt-1 text-sm text-slate-500">{s}</p>}
    </div>
    {children}
  </div>
);

function Laporan() {
  const { semuaCabang, cabangId, belanja, trx, branches } = useApp();
  const [per, setPer] = useState(7);
  const [shiftF, setShiftF] = useState(0);
  const periods = [
    ["Hari ini", 1],
    ["7 hari", 7],
    ["Bulan ini", 30],
  ] as const;
  const { aksesCabang } = useApp();
  const cabs = semuaCabang
    ? branches.filter((c) => aksesCabang.includes(c.id))
    : branches.filter((c) => c.id === cabangId);
  const nowDate = new Date();
  const start = new Date(nowDate);
  if (per === 1) start.setHours(0, 0, 0, 0);
  else if (per === 7) start.setDate(start.getDate() - 6);
  else start.setDate(1);
  const inPeriod = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? per === 1 : date >= start && date <= nowDate;
  };
  const visibleTrx = trx.filter(
    (t) =>
      t.status === "sah" &&
      inPeriod(t.waktu) &&
      (shiftF === 0 || t.shift === shiftF) &&
      (semuaCabang || !cabangId || t.cabangId === cabangId),
  );
  const visibleBelanja = belanja.filter(
    (b) =>
      b.status === "selesai" &&
      inPeriod(b.waktu) &&
      (semuaCabang || !cabangId || b.cabangId === cabangId),
  );
  const omzetFinal = visibleTrx.reduce((sum, t) => sum + t.total, 0);
  const modal = visibleBelanja.reduce((sum, b) => sum + (b.harga ?? 0), 0);
  const laba = omzetFinal - modal;
  const ntrx = visibleTrx.length;
  const pointCount = per === 1 ? 24 : per === 7 ? 7 : 30;
  const hourWib = (value: string | Date) =>
    Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        hour12: false,
      }).format(typeof value === "string" ? new Date(value) : value),
    );
  const bars = Array.from({ length: pointCount }, (_, index) => {
    const date = new Date(start);
    if (per === 1) date.setHours(index);
    else date.setDate(start.getDate() + index);
    return visibleTrx
      .filter((t) =>
        per === 1 ? hourWib(t.waktu) === index : businessDate(t.waktu) === businessDate(date),
      )
      .reduce((sum, t) => sum + t.total, 0);
  });
  const hari =
    per === 1 ? Array.from({ length: 24 }, (_, i) => `${i}:00`) : bars.map((_, i) => `${i + 1}`);
  const maxB = Math.max(...bars, 1);
  const stats = [
    ["Omzet", rp(omzetFinal), "text-brand-700"],
    ["Transaksi", `${ntrx}`, ""],
    ["Belanja (modal)", rp(modal), "text-amber-700"],
    ["Laba", rp(laba), "text-emerald-600"],
  ];
  return (
    <>
      <Title t="Laporan" s={semuaCabang ? "Gabungan seluruh cabang" : cabs[0]?.nama}>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-xl bg-slate-200/60 p-1">
            {periods.map(([l, v]) => (
              <button
                key={v}
                onClick={() => setPer(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${per === v ? "bg-white shadow-sm" : "text-slate-500"}`}
              >
                {l}
              </button>
            ))}
          </div>
          <select
            value={shiftF}
            onChange={(e) => setShiftF(+e.target.value)}
            className="rounded-xl bg-white px-3 py-2 text-xs font-bold ring-1 ring-slate-200"
          >
            <option value={0}>Semua shift</option>
            <option value={1}>Shift 1</option>
            <option value={2}>Shift 2</option>
          </select>
        </div>
      </Title>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(([l, v, c]) => (
          <Card key={l}>
            <p className="text-xs font-semibold text-slate-500">{l}</p>
            <p className={`mt-1 text-xl font-black lg:text-2xl ${c}`}>{v}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-4 font-bold">Omzet harian</p>
          <div className="flex h-44 items-end gap-3">
            {bars.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-500"
                  style={{ height: `${v > 0 ? Math.max((v / maxB) * 100, 4) : 2}%` }}
                />
                <span className="text-[10px] font-semibold text-slate-400">{hari[i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <p className="mb-3 font-bold">Produk terlaris</p>
          {[
            ["Cimol 10k", 46],
            ["Cibay", 32],
            ["Cireng", 24],
            ["Cimol 5k", 18],
          ].map(([n, v], i) => (
            <div key={n} className="mb-3">
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-semibold">
                  {i + 1}. {n}
                </span>
                <span className="text-slate-400">{v}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-amber-400"
                  style={{ width: `${(+v / 46) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-3 font-bold">Rekap per shift</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-400">
                <th className="pb-2">Shift</th>
                <th>Omzet</th>
                <th className="text-right">Selisih kas</th>
              </tr>
            </thead>
            <tbody>
              {SHIFTS.map((s, i) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-3 font-semibold">{s.nama}</td>
                  <td>{rp(omzetFinal * (i ? 0.44 : 0.56))}</td>
                  <td className={`text-right font-bold ${i ? "text-red-600" : "text-emerald-600"}`}>
                    {i ? "−Rp 2.000" : "Rp 0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {semuaCabang && (
          <Card>
            <p className="mb-3 font-bold">Perbandingan cabang</p>
            {cabs.map((c) => (
              <div key={c.id} className="mb-3">
                <div className="mb-1 flex justify-between text-xs">
                  <span className="font-semibold">{c.nama}</span>
                  <b>
                    {rp(
                      omzetFinal *
                        (c.mult /
                          Math.max(
                            cabs.reduce((sum, branch) => sum + branch.mult, 0),
                            1,
                          )),
                    )}
                  </b>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-2.5 rounded-full bg-brand-600"
                    style={{ width: `${c.mult * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}

function StokAdmin({ ro }: { ro: boolean }) {
  const { stok, saveStok, delStok, opname } = useApp();
  const [edit, setEdit] = useState<Partial<Stok> | null>(null);
  const [op, setOp] = useState<Stok | null>(null);
  const [fisik, setFisik] = useState("");
  const [alasan, setAlasan] = useState("");
  return (
    <>
      <Title t="Stok bahan" s="Saldo dihitung dari ledger pergerakan stok.">
        <Btn
          disabled={ro}
          onClick={() =>
            setEdit({ nama: "", unit: "kg", hargaUnit: 0, min: 0, kategori: "Lainnya" })
          }
        >
          <Plus size={16} />
          Tambah item
        </Btn>
      </Title>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stok.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{s.nama}</p>
                <p className="text-xs text-slate-500">
                  {s.kategori} · {rp(s.hargaUnit)}/{s.unit}
                </p>
              </div>
              <StokChip s={s} />
            </div>
            <p className="mt-3 text-3xl font-black tabular-nums">
              {s.qty}
              <span className="ml-1 text-sm font-semibold text-slate-400">{s.unit}</span>
            </p>
            <p className="text-xs text-slate-400">
              Minimal {s.min} {s.unit}
            </p>
            <div className="mt-4 flex gap-2">
              <Btn
                variant="soft"
                disabled={ro}
                className="flex-1 !py-2"
                onClick={() => {
                  setOp(s);
                  setFisik(String(s.qty));
                  setAlasan("");
                }}
              >
                <ClipboardCheck size={14} />
                Opname
              </Btn>
              <Btn variant="ghost" disabled={ro} className="!px-3 !py-2" onClick={() => setEdit(s)}>
                <Pencil size={14} />
              </Btn>
              <Btn
                variant="danger"
                disabled={ro}
                className="!px-3 !py-2"
                onClick={() => delStok(s.id)}
              >
                <Trash2 size={14} />
              </Btn>
            </div>
          </Card>
        ))}
      </div>
      {edit && (
        <Sheet title={edit.id ? "Ubah item" : "Tambah item"} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <Field label="Nama">
              <input
                className={inputCls}
                value={edit.nama}
                onChange={(e) => setEdit({ ...edit, nama: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Satuan">
                <input
                  className={inputCls}
                  value={edit.unit}
                  onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                />
              </Field>
              <Field label="Kategori">
                <select
                  className={inputCls}
                  value={edit.kategori}
                  onChange={(e) => setEdit({ ...edit, kategori: e.target.value })}
                >
                  {["Cimol", "Cibay", "Cireng", "Bumbu", "Lainnya"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </Field>
              <Field label="Harga / unit">
                <input
                  type="number"
                  className={inputCls}
                  value={edit.hargaUnit}
                  onChange={(e) => setEdit({ ...edit, hargaUnit: +e.target.value })}
                />
              </Field>
              <Field label="Stok minimal">
                <input
                  type="number"
                  className={inputCls}
                  value={edit.min}
                  onChange={(e) => setEdit({ ...edit, min: +e.target.value })}
                />
              </Field>
            </div>
            <Btn
              className="w-full"
              disabled={!edit.nama}
              onClick={() => {
                saveStok(edit);
                setEdit(null);
              }}
            >
              Simpan
            </Btn>
          </div>
        </Sheet>
      )}
      {op && (
        <Sheet title={`Opname · ${op.nama}`} onClose={() => setOp(null)}>
          <div className="space-y-3">
            <div className="flex justify-between rounded-xl bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">Saldo sistem</span>
              <b>
                {op.qty} {op.unit}
              </b>
            </div>
            <Field label={`Qty fisik (${op.unit})`}>
              <input
                type="number"
                className={inputCls}
                value={fisik}
                onChange={(e) => setFisik(e.target.value)}
              />
            </Field>
            {fisik !== "" && (
              <p
                className={`text-sm font-bold ${+fisik - op.qty === 0 ? "text-slate-400" : +fisik > op.qty ? "text-emerald-600" : "text-red-600"}`}
              >
                Selisih: {+fisik - op.qty > 0 ? "+" : ""}
                {+fisik - op.qty} {op.unit}
              </p>
            )}
            <Field label="Alasan (wajib)">
              <input
                className={inputCls}
                value={alasan}
                onChange={(e) => setAlasan(e.target.value)}
                placeholder="Contoh: rusak, tumpah, salah hitung"
              />
            </Field>
            <Btn
              className="w-full"
              disabled={!alasan.trim() || fisik === ""}
              onClick={() => {
                opname(op.id, +fisik);
                setOp(null);
              }}
            >
              Simpan opname
            </Btn>
          </div>
        </Sheet>
      )}
    </>
  );
}

function BelanjaAdmin({ ro }: { ro: boolean }) {
  const { belanja, konfirmasi, tolak, delBelanja, editBelanja } = useApp();
  const [conf, setConf] = useState<Belanja | null>(null);
  const [edit, setEdit] = useState<Belanja | null>(null);
  const [harga, setHarga] = useState("");
  const pend = belanja.filter((b) => b.status === "pending");
  const rest = belanja.filter((b) => b.status !== "pending");
  return (
    <>
      <Title t="Belanja" s="Konfirmasi otomatis menambah saldo stok satu kali." />
      <h2 className="mb-2 text-sm font-bold text-slate-500">Menunggu keputusan ({pend.length})</h2>
      {pend.length === 0 ? (
        <Card>
          <Empty icon={<Check />} text="Tidak ada pengajuan pending" />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pend.map((b) => (
            <Card key={b.id}>
              <div className="flex justify-between">
                <div>
                  <p className="font-bold">{b.nama}</p>
                  <p className="text-sm text-slate-500">
                    {b.qty} {b.unit}
                  </p>
                  <p className="text-xs text-slate-400">
                    Diajukan {b.oleh} · {formatWib(b.waktu)}
                  </p>
                  {b.catatan && <p className="mt-1 text-xs italic text-slate-500">"{b.catatan}"</p>}
                </div>
                <Chip tone="yellow">pending</Chip>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <Btn
                  variant="success"
                  disabled={ro}
                  className="col-span-2 !py-2.5"
                  onClick={() => {
                    setConf(b);
                    setHarga("");
                  }}
                >
                  <Check size={14} />
                  Selesai
                </Btn>
                <Btn variant="ghost" disabled={ro} className="!py-2.5" onClick={() => setEdit(b)}>
                  <Pencil size={14} />
                </Btn>
                <Btn
                  variant="danger"
                  disabled={ro}
                  className="!py-2.5"
                  onClick={() => delBelanja(b.id)}
                >
                  <Trash2 size={14} />
                </Btn>
                <Btn
                  variant="ghost"
                  disabled={ro}
                  className="col-span-4 !py-2 text-red-600"
                  onClick={() => tolak(b.id)}
                >
                  <X size={14} />
                  Tolak
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
      <h2 className="mb-2 mt-6 text-sm font-bold text-slate-500">Riwayat</h2>
      <div className="space-y-2">
        {rest.map((b) => (
          <Card key={b.id} className="flex items-center justify-between !p-3.5">
            <div>
              <p className="font-bold">
                {b.nama}{" "}
                <span className="text-sm font-normal text-slate-500">
                  · {b.qty} {b.unit}
                </span>
              </p>
              <p className="text-xs text-slate-400">
                {formatWib(b.waktu)}
                {b.harga ? ` · ${rp(b.harga)}` : ""}
              </p>
            </div>
            <Chip tone={b.status === "selesai" ? "green" : "red"}>{b.status}</Chip>
          </Card>
        ))}
      </div>
      {conf && (
        <Sheet title="Konfirmasi belanja" onClose={() => setConf(null)}>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              {conf.nama} · {conf.qty} {conf.unit} akan masuk ke stok.
            </p>
            <Field label="Harga final (Rp, wajib)">
              <input
                className={inputCls}
                inputMode="numeric"
                value={harga}
                onChange={(e) => setHarga(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Btn
              variant="success"
              className="w-full"
              disabled={!harga}
              onClick={() => {
                konfirmasi(conf.id, +harga);
                setConf(null);
              }}
            >
              Tandai selesai
            </Btn>
          </div>
        </Sheet>
      )}
      {edit && (
        <Sheet title="Ubah pengajuan" onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <Field label="Jumlah">
              <input
                type="number"
                className={inputCls}
                value={edit.qty}
                onChange={(e) => setEdit({ ...edit, qty: +e.target.value })}
              />
            </Field>
            <Field label="Catatan">
              <input
                className={inputCls}
                value={edit.catatan}
                onChange={(e) => setEdit({ ...edit, catatan: e.target.value })}
              />
            </Field>
            <Btn
              className="w-full"
              onClick={() => {
                editBelanja(edit.id, { qty: edit.qty, catatan: edit.catatan });
                setEdit(null);
              }}
            >
              Simpan
            </Btn>
          </div>
        </Sheet>
      )}
    </>
  );
}

function TransaksiAdmin({ ro }: { ro: boolean }) {
  const { trx, voidTrx } = useApp();
  const [sel, setSel] = useState<string | null>(null);
  const [alasan, setAlasan] = useState("");
  const t = trx.find((x) => x.id === sel);
  return (
    <>
      <Title
        t="Transaksi"
        s="Transaksi tidak bisa diedit. Koreksi dilakukan lewat void dengan alasan."
      />
      <Card className="!p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {trx.map((x) => (
            <button
              key={x.id}
              onClick={() => {
                setSel(x.id);
                setAlasan("");
              }}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left hover:bg-slate-50"
            >
              <div>
                <p className="text-sm font-bold">{x.nomor}</p>
                <p className="text-xs text-slate-500">
                  {formatWib(x.waktu)} · {x.kasir} · Shift {x.shift}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <b className={x.status === "void" ? "line-through opacity-40" : ""}>
                  {rp(x.total)}
                </b>
                <Chip tone={x.status === "sah" ? "green" : "red"}>{x.status}</Chip>
              </div>
            </button>
          ))}
        </div>
      </Card>
      {t && (
        <Sheet title={t.nomor} onClose={() => setSel(null)}>
          <TrxDetail t={t} />
          {t.status === "sah" && (
            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <Field label="Alasan void (wajib)">
                <input
                  className={inputCls}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                />
              </Field>
              <Btn
                variant="danger"
                className="w-full"
                disabled={ro || !alasan.trim()}
                onClick={() => {
                  voidTrx(t.id, alasan);
                  setSel(null);
                }}
              >
                Void transaksi
              </Btn>
            </div>
          )}
        </Sheet>
      )}
    </>
  );
}

function ShiftAdmin({ ro }: { ro: boolean }) {
  const { shift, forceClose, trx } = useApp();
  const omzet = trx.filter((t) => t.status === "sah").reduce((s, t) => s + t.total, 0);
  return (
    <>
      <Title t="Shift" s="Rekap shift dan tutup paksa bila kasir lupa menutup." />
      <h2 className="mb-2 text-sm font-bold text-slate-500">Shift aktif</h2>
      {shift ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 !ring-emerald-300">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              <p className="font-bold">{SHIFTS[shift.template - 1].nama}</p>
            </div>
            <p className="text-xs text-slate-500">
              Kasir Budi · dibuka {shift.dibuka} · kas awal {rp(shift.kasAwal)} · omzet {rp(omzet)}
            </p>
          </div>
          <Btn variant="danger" disabled={ro} onClick={forceClose}>
            Tutup paksa
          </Btn>
        </Card>
      ) : (
        <Card>
          <Empty icon={<Clock />} text="Tidak ada shift terbuka di cabang ini" />
        </Card>
      )}
      <h2 className="mb-2 mt-6 text-sm font-bold text-slate-500">Template shift</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {SHIFTS.map((s) => (
          <Card key={s.id}>
            <p className="font-bold">{s.nama}</p>
            <p className="text-sm text-slate-500">{s.jam}</p>
          </Card>
        ))}
      </div>
      <h2 className="mb-2 mt-6 text-sm font-bold text-slate-500">Riwayat shift</h2>
      <Card className="!p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {[
            ["Kemarin · Shift 2", "Sari", "Rp 1.240.000", "Rp 0"],
            ["Kemarin · Shift 1", "Budi", "Rp 980.000", "−Rp 2.000"],
            ["2 hari lalu · Shift 2", "Sari", "Rp 1.105.000", "Rp 0"],
          ].map((r) => (
            <div key={r[0]} className="flex items-center justify-between px-4 py-3.5 text-sm">
              <div>
                <p className="font-bold">{r[0]}</p>
                <p className="text-xs text-slate-500">{r[1]}</p>
              </div>
              <div className="text-right">
                <b>{r[2]}</b>
                <p
                  className={`text-xs font-bold ${r[3] === "Rp 0" ? "text-emerald-600" : "text-red-600"}`}
                >
                  Selisih {r[3]}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function CabangPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { branches } = useApp();
  return (
    <div className="flex flex-wrap gap-2">
      {branches.map((c) => {
        const on = value.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id])}
            className={`rounded-full px-3 py-2 text-xs font-bold ring-1 ${on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"}`}
          >
            {c.nama}
          </button>
        );
      })}
    </div>
  );
}

function Pengguna({ ro }: { ro: boolean }) {
  const { users, toggleUser, addUser, delUser, setUserCabang, role, aksesCabang, branches } =
    useApp();
  const [open, setOpen] = useState(false);
  const [hapus, setHapus] = useState<string | null>(null);
  const [akses, setAkses] = useState<{ id: string; cabang: string[] } | null>(null);
  const [f, setF] = useState({
    nama: "",
    username: "",
    password: "",
    role: "kasir" as "kasir" | "admin",
    cabang: ["c1"] as string[],
  });
  const tone = { owner: "blue", admin: "yellow", kasir: "gray" } as const;
  const owner = role === "owner";
  const list = owner
    ? users
    : users.filter((u) => u.role === "kasir" && u.cabang.some((c) => aksesCabang.includes(c)));
  const target = users.find((u) => u.id === hapus);
  const cabName = (u: { role: string; cabang: string[] }) =>
    u.role === "owner"
      ? "Semua cabang"
      : u.cabang.map((c) => branches.find((x) => x.id === c)?.nama).join(", ") ||
        "Belum ada cabang";
  return (
    <>
      <Title
        t="Pengguna"
        s="Akun dibuat lewat server (service_role) setelah role pemanggil diperiksa."
      >
        <Btn disabled={ro} onClick={() => setOpen(true)}>
          <Plus size={16} />
          Tambah akun
        </Btn>
      </Title>
      <Card className="!p-0 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {list.map((u) => (
            <div
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-extrabold text-brand-700">
                  {u.nama[0]}
                </div>
                <div>
                  <p className="text-sm font-bold">{u.nama}</p>
                  <p className="text-xs text-slate-500">
                    {u.username} · {cabName(u)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Chip tone={tone[u.role]}>{u.role}</Chip>
                {owner && u.role === "admin" && (
                  <Btn
                    variant="soft"
                    disabled={ro}
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => setAkses({ id: u.id, cabang: u.cabang })}
                  >
                    <Building2 size={13} />
                    Akses cabang
                  </Btn>
                )}
                {u.role !== "owner" && (
                  <button
                    disabled={ro}
                    onClick={() => toggleUser(u.id)}
                    className={`relative h-6 w-11 rounded-full transition disabled:opacity-40 ${u.aktif ? "bg-emerald-500" : "bg-slate-300"}`}
                    aria-label="Aktif"
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${u.aktif ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                )}
                {owner && u.role !== "owner" && (
                  <button
                    disabled={ro}
                    onClick={() => setHapus(u.id)}
                    className="rounded-lg bg-red-50 p-2 text-red-600 disabled:opacity-40"
                    aria-label="Hapus pengguna"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      {target && (
        <Sheet title="Hapus pengguna?" onClose={() => setHapus(null)}>
          <p className="mb-4 text-sm text-slate-500">
            <b>{target.nama}</b> ({target.username}) tidak akan bisa login lagi. Riwayat
            transaksinya tetap tersimpan. Tindakan ini dicatat di audit log.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="ghost" onClick={() => setHapus(null)}>
              Batal
            </Btn>
            <Btn
              variant="danger"
              onClick={() => {
                delUser(target.id);
                setHapus(null);
              }}
            >
              Ya, hapus
            </Btn>
          </div>
        </Sheet>
      )}
      {akses && (
        <Sheet title="Akses cabang admin" onClose={() => setAkses(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Admin dapat berpindah antar cabang yang dipilih.
            </p>
            <CabangPicker
              value={akses.cabang}
              onChange={(c) => setAkses({ ...akses, cabang: c })}
            />
            <Btn
              className="w-full"
              disabled={!akses.cabang.length}
              onClick={() => {
                setUserCabang(akses.id, akses.cabang);
                setAkses(null);
              }}
            >
              Simpan akses
            </Btn>
          </div>
        </Sheet>
      )}
      {open && (
        <Sheet title="Tambah akun" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Nama">
              <input
                className={inputCls}
                value={f.nama}
                onChange={(e) => setF({ ...f, nama: e.target.value })}
              />
            </Field>
            <Field
              label="Username"
              hint="Disamarkan menjadi email internal, mis. budi@c01.kasircimol.local"
            >
              <input
                className={inputCls}
                value={f.username}
                onChange={(e) => setF({ ...f, username: e.target.value })}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={inputCls}
                placeholder="Minimal 8 karakter"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
              />
            </Field>
            <Field label="Role">
              <select
                className={inputCls}
                value={f.role}
                onChange={(e) =>
                  setF({
                    ...f,
                    role: e.target.value as "kasir" | "admin",
                    cabang: e.target.value === "kasir" ? f.cabang.slice(0, 1) : f.cabang,
                  })
                }
              >
                <option value="kasir">Kasir</option>
                {owner && <option value="admin">Admin</option>}
              </select>
            </Field>
            <Field
              label={f.role === "admin" ? "Cabang yang dipegang (bisa lebih dari satu)" : "Cabang"}
            >
              {owner ? (
                f.role === "admin" ? (
                  <CabangPicker value={f.cabang} onChange={(c) => setF({ ...f, cabang: c })} />
                ) : (
                  <select
                    className={inputCls}
                    value={f.cabang[0]}
                    onChange={(e) => setF({ ...f, cabang: [e.target.value] })}
                  >
                    {branches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                  </select>
                )
              ) : (
                <select
                  className={inputCls}
                  value={f.cabang[0]}
                  onChange={(e) => setF({ ...f, cabang: [e.target.value] })}
                >
                  {branches
                    .filter((c) => aksesCabang.includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama}
                      </option>
                    ))}
                </select>
              )}
            </Field>
            <Btn
              className="w-full"
              disabled={!f.nama || !f.username || f.password.length < 8 || !f.cabang.length}
              onClick={() => {
                void addUser({ ...f, role: f.role }).then(() => setOpen(false));
              }}
            >
              Buat akun
            </Btn>
          </div>
        </Sheet>
      )}
    </>
  );
}

function MenuAdmin({ ro }: { ro: boolean }) {
  const { produk, addProduk, delProduk, bumbu, addBumbu, delBumbu } = useApp();
  const [open, setOpen] = useState(false);
  const [nb, setNb] = useState("");
  const [f, setF] = useState({
    nama: "",
    tipe: "pcs" as "pcs" | "porsi",
    harga: "1000",
    porsi: "5000, 8000, 10000",
  });
  const submit = () => {
    if (f.tipe === "pcs") addProduk({ nama: f.nama.trim(), tipe: "pcs", harga: +f.harga });
    else
      addProduk({
        nama: f.nama.trim(),
        tipe: "porsi",
        porsi: f.porsi
          .split(",")
          .map((x) => +x.trim())
          .filter((x) => x > 0),
      });
    setOpen(false);
    setF({ nama: "", tipe: "pcs", harga: "1000", porsi: "5000, 8000, 10000" });
  };
  return (
    <>
      <Title t="Menu & bumbu" s="Daftar ini yang tampil di halaman Kasir (Pilih produk).">
        <Btn disabled={ro} onClick={() => setOpen(true)}>
          <Plus size={16} />
          Tambah menu
        </Btn>
      </Title>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {produk.map((p) => (
          <Card key={p.id} className="flex items-center gap-3">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-black ${p.tone}`}
            >
              {p.nama[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold">{p.nama}</p>
              <p className="text-xs text-slate-500">
                {p.tipe === "porsi"
                  ? `Porsi ${p.porsi!.map((n) => n / 1000 + "k").join(" / ")} + nominal bebas`
                  : `${rp(p.harga!)} / pcs · pilihan 5/10/15/20`}
              </p>
            </div>
            <button
              disabled={ro}
              onClick={() => delProduk(p.id)}
              className="rounded-lg bg-red-50 p-2 text-red-600 disabled:opacity-40"
              aria-label="Hapus menu"
            >
              <Trash2 size={15} />
            </button>
          </Card>
        ))}
      </div>
      <h2 className="mb-2 mt-8 flex items-center gap-2 text-lg font-extrabold">
        <Tag size={18} />
        Bumbu <span className="text-sm font-normal text-slate-400">({bumbu.length})</span>
      </h2>
      <Card>
        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (nb.trim()) {
              addBumbu(nb.trim());
              setNb("");
            }
          }}
        >
          <input
            className={inputCls}
            placeholder="Nama bumbu baru, mis. Matcha"
            value={nb}
            onChange={(e) => setNb(e.target.value)}
            disabled={ro}
          />
          <Btn type="submit" disabled={ro || !nb.trim()}>
            <Plus size={16} />
            Tambah
          </Btn>
        </form>
        <div className="flex flex-wrap gap-2">
          {bumbu.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1.5 pl-3 pr-1.5 text-xs font-bold"
            >
              {b}
              <button
                disabled={ro}
                onClick={() => delBumbu(b)}
                className="rounded-full p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-40"
                aria-label={`Hapus ${b}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      </Card>
      {open && (
        <Sheet title="Tambah menu produk" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Nama menu">
              <input
                className={inputCls}
                value={f.nama}
                onChange={(e) => setF({ ...f, nama: e.target.value })}
                placeholder="Mis. Basreng"
              />
            </Field>
            <Field label="Jenis penjualan">
              <select
                className={inputCls}
                value={f.tipe}
                onChange={(e) => setF({ ...f, tipe: e.target.value as "pcs" | "porsi" })}
              >
                <option value="pcs">Per pcs (cepat 5/10/15/20)</option>
                <option value="porsi">Per porsi (nominal)</option>
              </select>
            </Field>
            {f.tipe === "pcs" ? (
              <Field label="Harga per pcs (Rp)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={f.harga}
                  onChange={(e) => setF({ ...f, harga: e.target.value.replace(/\D/g, "") })}
                />
              </Field>
            ) : (
              <Field label="Pilihan porsi (Rp, pisahkan koma)">
                <input
                  className={inputCls}
                  value={f.porsi}
                  onChange={(e) => setF({ ...f, porsi: e.target.value })}
                />
              </Field>
            )}
            <Btn
              className="w-full"
              disabled={!f.nama.trim() || (f.tipe === "pcs" && !+f.harga)}
              onClick={submit}
            >
              Simpan menu
            </Btn>
          </div>
        </Sheet>
      )}
    </>
  );
}

function CabangPage() {
  const { say, users, produk, branches, addBranch } = useApp();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <>
      <Title t="Cabang" s="Tambah cabang otomatis membuat 2 template shift dan menyalin katalog.">
        <Btn onClick={() => setOpen(true)}>
          <Plus size={16} />
          Tambah cabang
        </Btn>
      </Title>
      <div className="grid gap-3 md:grid-cols-3">
        {branches.map((c) => {
          const admins = users.filter((u) => u.role === "admin" && u.cabang.includes(c.id));
          return (
            <Card key={c.id}>
              <div className="flex items-start justify-between">
                <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600">
                  <Building2 size={20} />
                </div>
                <Chip tone="green">Aktif</Chip>
              </div>
              <p className="mt-3 text-lg font-extrabold">{c.nama}</p>
              <p className="text-xs text-slate-500">
                {c.kode} · {c.alamat}
              </p>
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-1.5 text-[11px] font-bold uppercase text-slate-400">
                  Dipegang admin
                </p>
                {admins.length ? (
                  admins.map((a) => (
                    <div key={a.id} className="mb-1 flex items-center gap-2 text-sm font-semibold">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[11px] font-extrabold text-amber-800">
                        {a.nama[0]}
                      </span>
                      {a.nama}
                      {a.cabang.length > 1 && (
                        <Chip tone="gray">+{a.cabang.length - 1} cabang lain</Chip>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-red-500">Belum ada admin</p>
                )}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Asia/Jakarta · 2 shift · {produk.length} produk
              </p>
            </Card>
          );
        })}
      </div>
      {open && (
        <Sheet title="Tambah cabang" onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <Field label="Nama cabang">
              <input className={inputCls} value={nama} onChange={(e) => setNama(e.target.value)} />
            </Field>
            <Field label="Alamat">
              <input
                className={inputCls}
                value={alamat}
                onChange={(e) => setAlamat(e.target.value)}
              />
            </Field>
            <Field label="Zona waktu">
              <select className={inputCls}>
                <option>Asia/Jakarta</option>
                <option>Asia/Makassar</option>
                <option>Asia/Jayapura</option>
              </select>
            </Field>
            <Btn
              className="w-full"
              disabled={saving || !nama.trim() || !alamat.trim()}
              onClick={() => {
                setSaving(true);
                void addBranch({
                  kode: "",
                  nama: nama.trim(),
                  alamat: alamat.trim(),
                  mult: 1,
                })
                  .then(() => {
                    setNama("");
                    setAlamat("");
                    setOpen(false);
                  })
                  .catch((error: unknown) => {
                    say(
                      error instanceof Error
                        ? `Gagal membuat cabang: ${error.message}`
                        : "Gagal membuat cabang",
                    );
                  })
                  .finally(() => setSaving(false));
              }}
            >
              {saving ? "Menyimpan..." : "Simpan cabang"}
            </Btn>
          </div>
        </Sheet>
      )}
    </>
  );
}

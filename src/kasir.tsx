import { useEffect, useMemo, useState } from "react";
import { Banknote, QrCode, UserPlus, X } from "lucide-react";
import {
  Boxes,
  Clock,
  History,
  LogOut,
  Lock,
  Plus,
  ReceiptText,
  ShoppingBasket,
  Store,
  Trash2,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  WifiOff,
  Wifi,
} from "lucide-react";
import { formatWib, useApp, rp, SHIFTS, statusStok, type Trx } from "./store";
import { Btn, Card, Chip, Empty, Field, inputCls, Sheet, StokChip, Stepper, SyncBadge } from "./ui";

type Tab = "kasir" | "keranjang" | "stok" | "belanja" | "riwayat" | "shift";

export default function KasirApp() {
  const { shift, carts, logout, nama, online, setOnline, cabangId, branches } = useApp();
  const [tab, setTab] = useState<Tab>(shift ? "kasir" : "shift");
  const count = carts.reduce((a, c) => a + c.items.reduce((s, i) => s + i.qty, 0), 0);
  const tabs: { id: Tab; l: string; i: typeof Store }[] = [
    { id: "kasir", l: "Kasir", i: Store },
    { id: "keranjang", l: "Keranjang", i: ShoppingBasket },
    { id: "stok", l: "Stok bahan", i: Boxes },
    { id: "belanja", l: "Belanja", i: ReceiptText },
    { id: "riwayat", l: "Riwayat", i: History },
  ];
  const guarded = (t: Tab) => ((t === "kasir" || t === "keranjang") && !shift ? "shift" : t);
  const cur = guarded(tab);
  return (
    <div className="min-h-screen bg-cream lg:flex">
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-r lg:border-t-0 lg:bg-brand-900 lg:p-4">
        <p className="mb-6 hidden px-3 pt-2 text-2xl font-black text-white lg:block">Kasir Cimol</p>
        <div className="grid grid-cols-5 lg:flex lg:flex-col lg:gap-1">
          {tabs.map((t) => {
            const on = cur === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-bold sm:text-xs lg:flex-row lg:gap-3 lg:rounded-xl lg:px-4 lg:text-sm ${on ? "text-brand-600 lg:bg-white lg:text-brand-900" : "text-slate-400 lg:text-white/70 lg:hover:bg-white/10"}`}
              >
                {on && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-600 lg:hidden" />
                )}
                <t.i size={20} />
                {t.l}
                {t.id === "keranjang" && count > 0 && (
                  <span className="absolute right-[22%] top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white lg:static lg:ml-auto">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 bg-brand-600 px-4 py-3 text-white sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-white/70">
                {branches.find((branch) => branch.id === cabangId)?.nama ?? "Cabang"} ·{" "}
                {branches.find((branch) => branch.id === cabangId)?.kode ?? "-"}
              </p>
              <p className="text-base font-extrabold">Halo, {nama.split(" ")[0]}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setOnline(!online)}
                className="hidden items-center gap-1.5 text-[11px] font-semibold text-white/70 hover:underline sm:flex"
              >
                {online ? <WifiOff size={12} /> : <Wifi size={12} />} Simulasi{" "}
                {online ? "offline" : "online"}
              </button>
              <SyncBadge dark />
              <button onClick={logout} className="rounded-full bg-white/15 p-2" aria-label="Keluar">
                <LogOut size={16} />
              </button>
            </div>
          </div>
          <button
            onClick={() => setTab("shift")}
            className={`mt-3 flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold sm:w-auto sm:min-w-80 ${shift ? "bg-white/15" : "bg-amber-400 text-amber-950"}`}
          >
            <span className="flex items-center gap-2">
              <Clock size={14} />
              {shift
                ? `${SHIFTS[shift.template - 1].nama} · sejak ${shift.dibuka}`
                : "Shift belum dibuka"}
            </span>
            <span className="ml-4">{shift ? "Kelola" : "Buka sekarang"}</span>
          </button>
          <button
            onClick={() => setOnline(!online)}
            className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-white/60 sm:hidden"
          >
            {online ? <WifiOff size={11} /> : <Wifi size={11} />} Simulasikan{" "}
            {online ? "putus internet" : "internet pulih"}
          </button>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-5 sm:px-6 lg:px-8 lg:pb-10">
          {cur === "shift" && (
            <div className="mx-auto max-w-xl">
              <ShiftPage onDone={() => setTab("kasir")} />
            </div>
          )}
          {cur === "kasir" && <Pos goCart={() => setTab("keranjang")} />}
          {cur === "keranjang" && <CartPage back={() => setTab("kasir")} />}
          {cur === "stok" && <StokView />}
          {cur === "belanja" && <BelanjaKasir />}
          {cur === "riwayat" && <Riwayat />}
        </main>
      </div>
    </div>
  );
}

function ShiftPage({ onDone }: { onDone: () => void }) {
  const { shift, openShift, closeShift, trx, carts } = useApp();
  const cart = carts.flatMap((c) => c.items);
  const [pick, setPick] = useState(1);
  const [kas, setKas] = useState("100000");
  const [fisik, setFisik] = useState("");
  const [catatan, setCatatan] = useState("");
  const [confirm, setConfirm] = useState(false);

  if (!shift) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold">Buka shift</h1>
          <p className="mt-1 text-sm text-slate-500">
            Transaksi hanya bisa dibuat saat shift terbuka. Satu cabang hanya boleh punya satu shift
            aktif.
          </p>
        </div>
        <div className="space-y-2">
          {SHIFTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setPick(s.id)}
              className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ring-2 transition ${pick === s.id ? "bg-brand-50 ring-brand-600" : "bg-white ring-transparent"}`}
            >
              <div>
                <p className="font-bold">{s.nama}</p>
                <p className="text-xs text-slate-500">{s.jam}</p>
              </div>
              <span
                className={`h-5 w-5 rounded-full border-2 ${pick === s.id ? "border-brand-600 bg-brand-600 shadow-[inset_0_0_0_3px_white]" : "border-slate-300"}`}
              />
            </button>
          ))}
        </div>
        <Field label="Kas awal (Rp)">
          <input
            className={inputCls}
            inputMode="numeric"
            value={kas}
            onChange={(e) => setKas(e.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Btn
          className="w-full"
          onClick={() => {
            openShift(pick, Number(kas) || 0);
            onDone();
          }}
        >
          Buka {SHIFTS[pick - 1].nama}
        </Btn>
      </div>
    );
  }
  const mine = trx.filter((t) => t.shift === shift.template && t.status === "sah");
  const omzet = mine.reduce((s, t) => s + t.total, 0);
  const qris = mine.filter((t) => t.metode === "qris").reduce((s, t) => s + t.total, 0);
  const seharusnya = shift.kasAwal + omzet - qris;
  const selisih = fisik ? Number(fisik) - seharusnya : 0;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Tutup shift</h1>
        <p className="mt-1 text-sm text-slate-500">
          {SHIFTS[shift.template - 1].nama} · dibuka {shift.dibuka}
        </p>
      </div>
      <Card className="space-y-3">
        {[
          ["Jumlah transaksi", `${mine.length}`],
          ["Omzet", rp(omzet)],
          ["Pembayaran QRIS (tidak masuk kas)", rp(qris)],
          ["Kas awal", rp(shift.kasAwal)],
        ].map(([a, b]) => (
          <div key={a} className="flex justify-between text-sm">
            <span className="text-slate-500">{a}</span>
            <b>{b}</b>
          </div>
        ))}
        <div className="flex justify-between border-t border-dashed border-slate-200 pt-3 text-sm">
          <span className="font-semibold">Kas seharusnya</span>
          <b className="text-brand-700">{rp(seharusnya)}</b>
        </div>
      </Card>
      <Field label="Kas fisik hasil hitung (Rp)">
        <input
          className={inputCls}
          inputMode="numeric"
          placeholder="0"
          value={fisik}
          onChange={(e) => setFisik(e.target.value.replace(/\D/g, ""))}
        />
      </Field>
      {fisik && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold ${selisih === 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          <span className="flex items-center gap-2">
            {selisih === 0 ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}Selisih
          </span>
          <span>
            {selisih > 0 ? "+" : ""}
            {rp(selisih)}
          </span>
        </div>
      )}
      <Field label="Catatan">
        <textarea
          className={inputCls}
          rows={2}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Opsional"
        />
      </Field>
      {cart.length > 0 && (
        <p className="text-xs text-amber-700">
          Keranjang berisi {cart.length} item dan akan dikosongkan saat shift ditutup.
        </p>
      )}
      <Btn variant="danger" className="w-full" disabled={!fisik} onClick={() => setConfirm(true)}>
        <Lock size={16} />
        Tutup shift
      </Btn>
      {confirm && (
        <Sheet title="Tutup shift sekarang?" onClose={() => setConfirm(false)}>
          <p className="mb-4 text-sm text-slate-500">
            Setelah ditutup, kasir tidak bisa membuat transaksi sampai shift berikutnya dibuka.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="ghost" onClick={() => setConfirm(false)}>
              Batal
            </Btn>
            <Btn
              onClick={() => {
                closeShift();
                setConfirm(false);
              }}
            >
              Ya, tutup
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Pos({ goCart }: { goCart: () => void }) {
  const { addCart, carts, activeId, produk } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const cart = carts.find((c) => c.id === activeId)?.items ?? [];
  const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const p = produk.find((x) => x.id === open);
  const label = carts.find((c) => c.id === activeId)?.label;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Pilih produk</h1>
        <p className="text-sm text-slate-500">
          Pesanan masuk ke <b className="text-brand-700">{label}</b>. Menu dan bumbu diatur
          admin/owner.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {produk.map((x) => (
          <button
            key={x.id}
            onClick={() => setOpen(x.id)}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-slate-200/70 transition active:scale-[.98]"
          >
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black ${x.tone}`}
            >
              {x.nama[0]}
            </div>
            <div className="flex-1">
              <p className="text-lg font-extrabold">{x.nama}</p>
              <p className="text-xs text-slate-500">
                {x.tipe === "porsi"
                  ? `Porsi ${x.porsi!.map((n) => n / 1000 + "k").join(" / ")} atau nominal bebas`
                  : `${rp(x.harga!)} / pcs`}
              </p>
            </div>
            <span className="rounded-full bg-brand-600 p-2 text-white">
              <Plus size={16} />
            </span>
          </button>
        ))}
      </div>
      {cart.length > 0 && (
        <button
          onClick={goCart}
          className="anim-sheet fixed inset-x-4 bottom-20 z-20 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-slate-900 px-5 py-4 text-white shadow-xl lg:inset-x-auto lg:bottom-6 lg:right-8 lg:mx-0 lg:w-96"
        >
          <span className="text-sm font-semibold">
            {label} · {cart.reduce((s, i) => s + i.qty, 0)} item
          </span>
          <span className="font-extrabold">{rp(total)} →</span>
        </button>
      )}
      {p && (
        <ProdukSheet
          id={p.id}
          onClose={() => setOpen(null)}
          onAdd={(i) => {
            addCart(i);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

function ProdukSheet({
  id,
  onClose,
  onAdd,
}: {
  id: string;
  onClose: () => void;
  onAdd: (i: {
    produk: string;
    nama: string;
    sub: string;
    bumbu: string[];
    harga: number;
    qty: number;
  }) => void;
}) {
  const { produk, bumbu: daftarBumbu } = useApp();
  const p = produk.find((x) => x.id === id)!;
  const [porsi, setPorsi] = useState(p.tipe === "porsi" ? p.porsi![0] : 0);
  const [custom, setCustom] = useState("");
  const [qty, setQty] = useState(p.tipe === "porsi" ? 1 : 5);
  const [bumbu, setBumbu] = useState<string[]>([]);
  const nominal = custom ? Number(custom) : porsi;
  const harga = p.tipe === "porsi" ? nominal : p.harga!;
  const toggle = (b: string) =>
    setBumbu((l) => (l.includes(b) ? l.filter((x) => x !== b) : [...l, b]));
  const valid = harga > 0 && qty > 0;
  return (
    <Sheet title={p.nama} onClose={onClose}>
      <div className="space-y-5">
        {p.tipe === "porsi" ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600">Porsi (pilih 1)</p>
            <div className="grid grid-cols-3 gap-2">
              {p.porsi!.map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    setPorsi(x);
                    setCustom("");
                  }}
                  className={`rounded-xl py-3 text-sm font-extrabold ring-2 ${!custom && porsi === x ? "bg-brand-50 text-brand-700 ring-brand-600" : "bg-slate-50 ring-transparent"}`}
                >
                  {x / 1000}k
                </button>
              ))}
            </div>
            <Field
              label="Atau nominal bebas (Rp)"
              hint="Mis. 15000 untuk pembeli yang minta porsi khusus"
            >
              <input
                className={`${inputCls} ${custom ? "!ring-2 !ring-brand-600" : ""}`}
                inputMode="numeric"
                placeholder="Masukkan nominal"
                value={custom}
                onChange={(e) => setCustom(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-600">Jumlah cepat (pcs)</p>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((n) => (
                <button
                  key={n}
                  onClick={() => setQty(n)}
                  className={`rounded-xl py-3 text-sm font-extrabold ring-2 ${qty === n ? "bg-brand-50 text-brand-700 ring-brand-600" : "bg-slate-50 ring-transparent"}`}
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Atur jumlah</p>
              <Stepper value={qty} min={1} onChange={setQty} />
            </div>
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">
            Bumbu{" "}
            <span className="font-normal text-slate-400">
              · bisa lebih dari satu, gratis. Kosong = Original
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {daftarBumbu.map((b) => (
              <button
                key={b}
                onClick={() => toggle(b)}
                className={`rounded-full px-3 py-2 text-xs font-bold ring-1 ${bumbu.includes(b) ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-slate-200"}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
        <Btn
          className="w-full"
          disabled={!valid}
          onClick={() =>
            onAdd({
              produk: id,
              nama:
                p.tipe === "porsi"
                  ? `${p.nama} ${custom ? rp(harga) : harga / 1000 + "k"}`
                  : p.nama,
              sub: bumbu.length ? bumbu.join(", ") : "Original",
              bumbu,
              harga,
              qty,
            })
          }
        >
          Tambah · {rp(harga * qty)}
        </Btn>
      </div>
    </Sheet>
  );
}

function CartPage({ back }: { back: () => void }) {
  const { cart, carts, activeId, setActive, newCart, removeCart, setQty, checkout, shift } =
    useApp();
  const [bayar, setBayar] = useState("");
  const [metode, setMetode] = useState<"tunai" | "qris">("tunai");
  const [done, setDone] = useState<Trx | null>(null);
  const total = cart.reduce((s, i) => s + i.harga * i.qty, 0);
  const uang = metode === "qris" ? total : Number(bayar) || 0;
  const label = carts.find((c) => c.id === activeId)?.label;
  const quick = useMemo(
    () =>
      Array.from(
        new Set(
          [
            total,
            Math.ceil(total / 5000) * 5000,
            Math.ceil(total / 10000) * 10000,
            20000,
            50000,
            100000,
          ].filter((n) => n >= total),
        ),
      ).slice(0, 4),
    [total],
  );
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Keranjang</h1>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {carts.map((c) => {
          const n = c.items.reduce((s, i) => s + i.qty, 0);
          return (
            <div
              key={c.id}
              className={`flex shrink-0 items-center rounded-full text-xs font-bold ${c.id === activeId ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
            >
              <button
                onClick={() => {
                  setActive(c.id);
                  setBayar("");
                }}
                className="py-2 pl-4 pr-2"
              >
                {c.label}
                {n > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${c.id === activeId ? "bg-white/25" : "bg-slate-100"}`}
                  >
                    {n}
                  </span>
                )}
              </button>
              {carts.length > 1 && (
                <button
                  onClick={() => removeCart(c.id)}
                  className="py-2 pl-1 pr-3 opacity-70"
                  aria-label={`Hapus ${c.label}`}
                >
                  <X size={12} />
                </button>
              )}
              {carts.length === 1 && <span className="pr-2" />}
            </div>
          );
        })}
        <button
          onClick={() => {
            newCart();
            setBayar("");
            back();
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-brand-600 px-4 py-2 text-xs font-bold text-brand-600"
        >
          <UserPlus size={13} />
          Pesanan baru
        </button>
      </div>
      {cart.length === 0 ? (
        <div className="mx-auto max-w-md">
          <Empty icon={<ShoppingBasket />} text={`${label} masih kosong`} />
          <Btn className="w-full" variant="soft" onClick={back}>
            Pilih produk
          </Btn>
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[1fr_380px]">
          <div className="space-y-2">
            {cart.map((i) => (
              <Card key={i.id} className="!p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold">{i.nama}</p>
                    <p className="truncate text-xs text-slate-500">{i.sub}</p>
                    <p className="mt-1 text-xs font-semibold text-brand-700">
                      {rp(i.harga)} × {i.qty}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <b>{rp(i.harga * i.qty)}</b>
                    <div className="flex items-center gap-2">
                      <Stepper value={i.qty} onChange={(n) => setQty(i.id, n)} />
                      <button
                        onClick={() => setQty(i.id, 0)}
                        className="rounded-lg bg-red-50 p-2.5 text-red-600"
                        aria-label="Hapus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-4 lg:sticky lg:top-40">
            <Card className="space-y-3">
              <div className="flex items-end justify-between">
                <span className="text-sm text-slate-500">Total {label}</span>
                <span className="text-3xl font-black text-brand-700">{rp(total)}</span>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">Metode pembayaran</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["tunai", "Tunai", Banknote],
                      ["qris", "QRIS", QrCode],
                    ] as const
                  ).map(([id, l, I]) => (
                    <button
                      key={id}
                      onClick={() => setMetode(id)}
                      className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold ring-2 ${metode === id ? "bg-brand-50 text-brand-700 ring-brand-600" : "bg-slate-50 ring-transparent text-slate-500"}`}
                    >
                      <I size={18} />
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {metode === "tunai" ? (
                <>
                  <Field label="Uang diterima (Rp)">
                    <input
                      className={`${inputCls} text-lg font-bold`}
                      inputMode="numeric"
                      placeholder="0"
                      value={bayar}
                      onChange={(e) => setBayar(e.target.value.replace(/\D/g, ""))}
                    />
                  </Field>
                  <div className="flex flex-wrap gap-2">
                    {quick.map((n) => (
                      <button
                        key={n}
                        onClick={() => setBayar(String(n))}
                        className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold"
                      >
                        {n === total ? "Uang pas" : rp(n)}
                      </button>
                    ))}
                  </div>
                  <div
                    className={`flex justify-between rounded-xl px-4 py-3 text-sm font-bold ${uang >= total ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}
                  >
                    <span>Kembalian</span>
                    <span>{rp(Math.max(0, uang - total))}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl bg-slate-50 p-4">
                  <div className="grid h-36 w-36 grid-cols-7 gap-0.5 rounded-xl bg-white p-2 ring-1 ring-slate-200">
                    {Array.from({ length: 49 }, (_, k) => (
                      <span
                        key={k}
                        className={
                          ((k * 7 + (k % 5) * 3 + k / 3) | 0) % 3 === 0 ||
                          [0, 1, 7, 6, 5, 13, 35, 42, 43, 41, 48, 47].includes(k)
                            ? "rounded-[1px] bg-slate-900"
                            : ""
                        }
                      />
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Minta pelanggan scan, lalu konfirmasi saat dana masuk
                  </p>
                </div>
              )}
            </Card>
            {!shift && <p className="text-sm font-semibold text-red-600">Shift belum dibuka.</p>}
            <Btn
              variant="success"
              className="w-full !py-4 text-base"
              disabled={uang < total || !shift}
              onClick={() => {
                setDone(checkout(uang, metode));
                setBayar("");
              }}
            >
              {metode === "qris" ? "Konfirmasi QRIS diterima" : "Bayar tunai"} · {rp(total)}
            </Btn>
          </div>
        </div>
      )}
      {done && (
        <Sheet
          title="Pembayaran berhasil"
          onClose={() => {
            setDone(null);
            back();
          }}
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>
            {done.metode === "tunai" ? (
              <div>
                <p className="text-xs text-slate-500">Kembalian</p>
                <p className="text-4xl font-black text-emerald-600">
                  {rp(done.dibayar - done.total)}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-slate-500">Dibayar via QRIS</p>
                <p className="text-4xl font-black text-emerald-600">{rp(done.total)}</p>
              </div>
            )}
            <p className="text-xs text-slate-400">
              {done.nomor} · tersimpan di perangkat dan masuk antrean sinkron
            </p>
            <Btn
              className="w-full"
              onClick={() => {
                setDone(null);
                back();
              }}
            >
              Lanjut
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function StokView() {
  const { stok } = useApp();
  const [f, setF] = useState("Semua");
  const cats = ["Semua", "Cimol", "Cibay", "Cireng", "Bumbu", "Lainnya"];
  const list = stok.filter((s) => f === "Semua" || s.kategori === f);
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Stok bahan</h1>
        <p className="text-sm text-slate-500">Hanya lihat. Perubahan stok dilakukan admin.</p>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setF(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold ${f === c ? "bg-brand-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {list.map((s) => (
          <Card key={s.id} className="flex items-center justify-between !p-3.5">
            <div>
              <p className="font-bold">{s.nama}</p>
              <p className="text-xs text-slate-500">
                {s.kategori} · min {s.min} {s.unit}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black tabular-nums">
                {s.qty} <span className="text-xs font-semibold text-slate-400">{s.unit}</span>
              </p>
              <StokChip s={s} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BelanjaKasir() {
  const { stok, belanja, ajukan } = useApp();
  const [open, setOpen] = useState(false);
  const [sid, setSid] = useState("");
  useEffect(() => {
    if (!sid && stok[0]?.id) setSid(stok[0].id);
  }, [sid, stok]);
  const [qty, setQty] = useState(1);
  const [cat, setCat] = useState("");
  const low = stok.filter((s) => statusStok(s) !== "Aman");
  const tone = { pending: "yellow", selesai: "green", ditolak: "red" } as const;
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Belanja</h1>
          <p className="text-sm text-slate-500">Ajukan, admin yang menyetujui.</p>
        </div>
        <Btn onClick={() => setOpen(true)} className="!px-3 !py-2.5">
          <Plus size={16} />
          Ajukan
        </Btn>
      </div>
      {low.length > 0 && (
        <Card className="!bg-amber-50 !ring-amber-200">
          <p className="mb-2 text-xs font-bold text-amber-800">Saran: stok menipis</p>
          <div className="space-y-2">
            {low.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span>
                  {s.nama}{" "}
                  <span className="text-xs text-amber-700">
                    ({s.qty} {s.unit})
                  </span>
                </span>
                <button
                  onClick={() => {
                    setSid(s.id);
                    setQty(s.min * 2);
                    setOpen(true);
                  }}
                  className="rounded-full bg-amber-500 px-3 py-1.5 text-[11px] font-bold text-white"
                >
                  Ajukan
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="grid gap-2 md:grid-cols-2">
        {belanja.map((b) => (
          <Card key={b.id} className="!p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold">{b.nama}</p>
                <p className="text-xs text-slate-500">
                  {b.qty} {b.unit} · {b.oleh} · {formatWib(b.waktu)}
                </p>
                {b.catatan && <p className="mt-1 text-xs italic text-slate-400">"{b.catatan}"</p>}
              </div>
              <Chip tone={tone[b.status]}>{b.status}</Chip>
            </div>
          </Card>
        ))}
      </div>
      {open && (
        <Sheet title="Ajukan belanja" onClose={() => setOpen(false)}>
          <div className="space-y-4">
            <Field label="Item stok">
              <select className={inputCls} value={sid} onChange={(e) => setSid(e.target.value)}>
                {stok.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.unit})
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Jumlah</span>
              <Stepper value={qty} min={1} onChange={setQty} />
            </div>
            <Field label="Catatan">
              <input
                className={inputCls}
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                placeholder="Opsional"
              />
            </Field>
            <Btn
              className="w-full"
              onClick={() => {
                ajukan(sid, qty, cat);
                setOpen(false);
                setCat("");
              }}
            >
              Kirim pengajuan
            </Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Riwayat() {
  const { trx, belanja, profileId } = useApp();
  const [seg, setSeg] = useState<"trx" | "bel">("trx");
  const [sel, setSel] = useState<Trx | null>(null);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Riwayat</h1>
      <div className="grid grid-cols-2 rounded-xl bg-slate-200/60 p-1">
        {(["trx", "bel"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSeg(s)}
            className={`rounded-lg py-2 text-xs font-bold ${seg === s ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            {s === "trx" ? "Transaksi shift saya" : "Belanja saya"}
          </button>
        ))}
      </div>
      {seg === "trx" ? (
        <div className="grid gap-2 md:grid-cols-2">
          {trx
            .filter((t) => !profileId || t.kasirId === profileId || t.kasir === nama)
            .map((t) => (
              <button key={t.id} onClick={() => setSel(t)} className="w-full text-left">
                <Card className="flex items-center justify-between !p-3.5">
                  <div>
                    <p
                      className={`font-bold ${t.status === "void" ? "line-through opacity-50" : ""}`}
                    >
                      {rp(t.total)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {t.nomor} · {formatWib(t.waktu)} · {t.kasir}
                    </p>
                  </div>
                  {t.status === "void" ? (
                    <Chip tone="red">Void</Chip>
                  ) : (
                    <Chip tone="green">Sah</Chip>
                  )}
                </Card>
              </button>
            ))}
        </div>
      ) : (
        <div className="space-y-2">
          {belanja
            .filter((b) => !profileId || b.olehId === profileId)
            .map((b) => (
              <Card key={b.id} className="flex justify-between !p-3.5">
                <div>
                  <p className="font-bold">{b.nama}</p>
                  <p className="text-xs text-slate-500">
                    {b.qty} {b.unit} · {formatWib(b.waktu)}
                  </p>
                </div>
                <Chip tone={b.status === "pending" ? "yellow" : "green"}>{b.status}</Chip>
              </Card>
            ))}
        </div>
      )}
      {sel && (
        <Sheet title={sel.nomor} onClose={() => setSel(null)}>
          <TrxDetail t={sel} />
        </Sheet>
      )}
    </div>
  );
}

export function TrxDetail({ t }: { t: Trx }) {
  return (
    <div className="space-y-3 text-sm">
      {t.items.map((i, k) => (
        <div key={k} className="flex justify-between">
          <div>
            <p className="font-semibold">
              {i.nama} × {i.qty}
            </p>
            <p className="text-xs text-slate-500">{i.sub}</p>
          </div>
          <b>{rp(i.harga * i.qty)}</b>
        </div>
      ))}
      <div className="space-y-1 border-t border-dashed border-slate-200 pt-3">
        <div className="flex justify-between">
          <span className="text-slate-500">Total</span>
          <b>{rp(t.total)}</b>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Dibayar</span>
          <span>{rp(t.dibayar)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Kembalian</span>
          <span>{rp(t.dibayar - t.total)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Metode</span>
          <span className="font-semibold uppercase">{t.metode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Kasir</span>
          <span>
            {t.kasir} · Shift {t.shift}
          </span>
        </div>
      </div>
      {t.voidAlasan && (
        <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700">Void: {t.voidAlasan}</p>
      )}
    </div>
  );
}
export { Wallet };

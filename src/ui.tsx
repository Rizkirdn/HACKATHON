import type { ReactNode } from "react";
import { Cloud, CloudOff, Loader2, X } from "lucide-react";
import { useApp, statusStok, type Stok } from "./store";

export function Btn({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "success" | "soft";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const v = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-600/20",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
    danger: "bg-red-50 text-red-700 hover:bg-red-100",
    ghost: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
    soft: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition active:scale-[.98] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:active:scale-100 ${v} ${className}`}
    >
      {children}
    </button>
  );
}

export function Chip({
  tone,
  children,
}: {
  tone: "green" | "yellow" | "red" | "blue" | "gray";
  children: ReactNode;
}) {
  const t = {
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-brand-50 text-brand-700",
    gray: "bg-slate-100 text-slate-600",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${t}`}
    >
      {children}
    </span>
  );
}

export function StokChip({ s }: { s: Stok }) {
  const st = statusStok(s);
  return <Chip tone={st === "Aman" ? "green" : st === "Menipis" ? "yellow" : "red"}>{st}</Chip>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white p-4 ring-1 ring-slate-200/70 ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}
export const inputCls =
  "w-full rounded-xl border-0 bg-slate-50 px-3.5 py-3 text-sm ring-1 ring-slate-200 placeholder:text-slate-400";

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center anim-fade">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="anim-sheet relative max-h-[90vh] w-full max-w-[460px] overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-500"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SyncBadge({ dark = false }: { dark?: boolean }) {
  const { online, queue, syncing, syncNow } = useApp();
  const state = !online ? "off" : syncing ? "sync" : "on";
  const cfg = {
    off: {
      c: "bg-red-500/15 text-red-600",
      t: queue ? `Offline · ${queue} antre` : "Offline",
      i: <CloudOff size={14} />,
    },
    sync: {
      c: "bg-amber-400/20 text-amber-600",
      t: "Menyinkronkan",
      i: <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />,
    },
    on: { c: "bg-emerald-500/15 text-emerald-600", t: "Online", i: <Cloud size={14} /> },
  }[state];
  return (
    <button
      onClick={syncNow}
      title="Sinkron sekarang"
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${dark ? "bg-white/15 text-white" : cfg.c}`}
    >
      {cfg.i}
      {cfg.t}
    </button>
  );
}

export function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className="anim-sheet fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
      {toast}
    </div>
  );
}

export function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-400">
      <div className="rounded-full bg-slate-100 p-4">{icon}</div>
      {text}
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-xl bg-slate-100 p-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="h-9 w-9 rounded-lg bg-white text-lg font-bold shadow-sm active:scale-90"
        aria-label="Kurangi"
      >
        −
      </button>
      <span className="w-10 text-center text-sm font-bold tabular-nums">{value}</span>
      <button
        onClick={() => onChange(value + 1)}
        className="h-9 w-9 rounded-lg bg-brand-600 text-lg font-bold text-white shadow-sm active:scale-90"
        aria-label="Tambah"
      >
        +
      </button>
    </div>
  );
}

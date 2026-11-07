import { useState } from "react";
import { ArrowRight, Building2, Layers, WifiOff, Cloud } from "lucide-react";
import { Provider, useApp } from "./store";
import { Btn, Field, inputCls, Toast } from "./ui";
import AdminApp from "./admin";
import KasirApp from "./kasir";

function Login() {
  const { login } = useApp();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/40" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-amber-400/20" />
        <p className="relative text-2xl font-black">Kasir Cimol</p>
        <div className="relative">
          <h1 className="text-5xl font-black leading-tight">
            Satu aplikasi untuk semua cabang jajanan Anda.
          </h1>
          <div className="mt-8 space-y-4 text-white/80">
            {[
              [WifiOff, "Tetap jualan saat internet putus"],
              [Cloud, "Sinkron otomatis ke Supabase"],
              [Building2, "Laporan per shift dan per cabang"],
            ].map(([I, t]) => {
              const Ic = I as typeof Cloud;
              return (
                <p key={t as string} className="flex items-center gap-3">
                  <span className="rounded-xl bg-white/10 p-2.5">
                    <Ic size={18} />
                  </span>
                  {t as string}
                </p>
              );
            })}
          </div>
        </div>
        <p className="relative text-xs text-white/40">Cimol · Cibay · Cireng</p>
      </section>
      <section className="flex items-center justify-center bg-cream p-6">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <p className="text-xl font-black text-brand-700 lg:hidden">Kasir Cimol</p>
            <h2 className="mt-2 text-3xl font-extrabold">Masuk</h2>
            <p className="mt-1 text-sm text-slate-500">
              Masuk dengan akun owner, admin, atau kasir melalui Supabase Auth.
            </p>
          </div>
          <div className="space-y-4">
            <Field
              label="Username atau email"
              hint="Gunakan email owner yang terdaftar di Supabase Auth"
            >
              <input className={inputCls} value={user} onChange={(e) => setUser(e.target.value)} />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={inputCls}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            <Btn className="w-full !py-3.5" onClick={() => void login("owner", user, password)}>
              Masuk <ArrowRight size={16} />
            </Btn>
          </div>
          <p className="text-center text-[11px] text-slate-400">
            Sesi tersimpan 7 hari untuk mode offline.
          </p>
        </div>
      </section>
    </div>
  );
}

function PilihCabang() {
  const { setCabang, nama, logout, branches, aksesCabang } = useApp();
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-6">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <p className="text-sm font-semibold text-slate-500">Halo, {nama}</p>
          <h1 className="text-3xl font-extrabold">Pilih cabang aktif</h1>
        </div>
        <button
          onClick={() => setCabang(null, true)}
          className="flex w-full items-center justify-between rounded-2xl bg-brand-600 p-5 text-left text-white shadow-lg shadow-brand-600/20"
        >
          <div className="flex items-center gap-4">
            <Layers size={26} />
            <div>
              <p className="text-lg font-extrabold">Semua cabang</p>
              <p className="text-xs text-white/70">Laporan gabungan dan perbandingan</p>
            </div>
          </div>
          <ArrowRight />
        </button>
        <div className="grid gap-3 sm:grid-cols-2">
          {branches
            .filter((c) => aksesCabang.includes(c.id))
            .map((c) => (
              <button
                key={c.id}
                onClick={() => setCabang(c.id)}
                className="rounded-2xl bg-white p-5 text-left ring-1 ring-slate-200 transition hover:ring-brand-600"
              >
                <Building2 className="text-brand-600" />
                <p className="mt-3 font-extrabold">{c.nama}</p>
                <p className="text-xs text-slate-500">
                  {c.kode} · {c.alamat}
                </p>
              </button>
            ))}
        </div>
        <button onClick={logout} className="text-sm font-semibold text-slate-400 underline">
          Keluar
        </button>
      </div>
    </div>
  );
}

function Router() {
  const { role, cabangId, semuaCabang } = useApp();
  if (!role) return <Login />;
  if (role === "kasir") return <KasirApp />;
  if (role === "owner" && !cabangId && !semuaCabang) return <PilihCabang />;
  return <AdminApp />;
}

export default function App() {
  return (
    <Provider>
      <Router />
      <Toast />
    </Provider>
  );
}

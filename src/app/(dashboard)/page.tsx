"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Transaksi, TipeTransaksi } from "@/types/database";

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function formatTanggal(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const KATEGORI_LIST = ["Kas Bulanan", "Iuran Acara", "Konsumsi", "Operasional", "Lain-lain"];

const BULAN_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/* ══════════════════════════════════════════════
   ICONS
   ══════════════════════════════════════════════ */

function IconArrowDown({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>);
}
function IconArrowUp({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>);
}
function IconPlus({ className = "" }: { className?: string }) {
  return (<svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>);
}
function IconReceipt({ className = "" }: { className?: string }) {
  return (<svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>);
}
function IconCheck({ className = "" }: { className?: string }) {
  return (<svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);
}
function IconWallet({ className = "" }: { className?: string }) {
  return (<svg className={className} width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a1 1 0 102 0 1 1 0 00-2 0z" /></svg>);
}
function IconSearch({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>);
}
function IconChart({ className = "" }: { className?: string }) {
  return (<svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
}
function IconUser({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
}
function IconSpark({ className = "" }: { className?: string }) {
  return (<svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>);
}
function IconSend({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>);
}
function IconX({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
}
function IconMinus({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>);
}
function IconWarning({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>);
}
function IconCheckCircle({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
}
function IconDownload({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
}
function IconLogout({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>);
}

/* ══════════════════════════════════════════════
   COMPONENT: SaldoCards
   ══════════════════════════════════════════════ */

function SaldoCards({ transaksi }: { transaksi: Transaksi[] }) {
  const pemasukan = transaksi.filter((t) => t.tipe === "pemasukan").reduce((s, t) => s + Number(t.nominal), 0);
  const pengeluaran = transaksi.filter((t) => t.tipe === "pengeluaran").reduce((s, t) => s + Number(t.nominal), 0);
  const saldo = pemasukan - pengeluaran;
  const cards = [
    { label: "Saldo", value: saldo, color: "from-indigo-500 to-violet-600", icon: <IconWallet className="text-white/80" /> },
    { label: "Pemasukan", value: pemasukan, color: "from-emerald-500 to-teal-600", icon: <IconArrowDown className="text-white/80" /> },
    { label: "Pengeluaran", value: pengeluaran, color: "from-rose-500 to-pink-600", icon: <IconArrowUp className="text-white/80" /> },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {cards.map((c) => (
        <div key={c.label} className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${c.color} p-5 shadow-lg transition-transform duration-200 hover:scale-[1.02]`}>
          <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -right-1 -bottom-4 h-14 w-14 rounded-full bg-white/5" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">{c.icon}<span className="text-sm font-medium text-white/80">{c.label}</span></div>
            <p className="text-2xl font-bold text-white tracking-tight">{formatRupiah(c.value)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENT: BarChart (Pure SVG)
   ══════════════════════════════════════════════ */

function FinanceBarChart({ transaksi }: { transaksi: Transaksi[] }) {
  const [hoveredBar, setHoveredBar] = useState<{ bulan: string; tipe: string; value: number } | null>(null);
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  // Build 6-month data from real transactions
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    const monthTx = transaksi.filter((t) => {
      const td = new Date(t.tanggal_transaksi);
      return td.getMonth() === month && td.getFullYear() === year;
    });
    return {
      bulan: BULAN_NAMES[month],
      pemasukan: monthTx.filter((t) => t.tipe === "pemasukan").reduce((s, t) => s + Number(t.nominal), 0),
      pengeluaran: monthTx.filter((t) => t.tipe === "pengeluaran").reduce((s, t) => s + Number(t.nominal), 0),
    };
  });

  const maxValue = Math.max(...chartData.flatMap((d) => [d.pemasukan, d.pengeluaran]), 100_000);
  const chartHeight = 200;
  const barWidth = 28;
  const groupGap = 48;
  const barGap = 6;
  const chartWidth = chartData.length * (barWidth * 2 + barGap + groupGap);
  const totalP = chartData.reduce((s, d) => s + d.pemasukan, 0);
  const totalE = chartData.reduce((s, d) => s + d.pengeluaran, 0);
  const trend = totalP >= totalE ? "surplus" : "defisit";
  const trendPct = totalE > 0 ? Math.round(((totalP - totalE) / totalE) * 100) : 100;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50"><IconChart className="text-amber-500" /></div>
          <div><h2 className="text-base font-bold text-slate-800">Kesehatan Keuangan</h2><p className="text-xs text-slate-400">Perbandingan 6 bulan terakhir</p></div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${trend === "surplus" ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200" : "bg-rose-50 text-rose-600 ring-1 ring-rose-200"}`}>
          {trend === "surplus" ? <IconArrowDown className="w-3 h-3" /> : <IconArrowUp className="w-3 h-3" />}
          {trend === "surplus" ? "+" : ""}{trendPct}% {trend}
        </div>
      </div>
      <div className="flex items-center gap-5 mb-4">
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-gradient-to-t from-emerald-500 to-emerald-400" /><span className="text-xs font-medium text-slate-500">Pemasukan</span></div>
        <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-gradient-to-t from-rose-500 to-rose-400" /><span className="text-xs font-medium text-slate-500">Pengeluaran</span></div>
      </div>
      <div className="relative overflow-x-auto">
        <svg width={chartWidth + 20} height={chartHeight + 50} className="mx-auto block">
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (<g key={pct}><line x1={0} y1={chartHeight - chartHeight * pct + 10} x2={chartWidth + 10} y2={chartHeight - chartHeight * pct + 10} stroke="#e2e8f0" strokeWidth={1} strokeDasharray={pct === 0 ? "0" : "4 4"} /></g>))}
          {chartData.map((d, i) => {
            const x = i * (barWidth * 2 + barGap + groupGap) + groupGap / 2;
            const hP = animated ? (d.pemasukan / maxValue) * chartHeight : 0;
            const hE = animated ? (d.pengeluaran / maxValue) * chartHeight : 0;
            return (<g key={d.bulan}>
              <rect x={x} y={chartHeight - hP + 10} width={barWidth} height={Math.max(hP, 0)} rx={6} fill="url(#gradP)" className="transition-all duration-700 ease-out cursor-pointer" opacity={hoveredBar && !(hoveredBar.bulan === d.bulan && hoveredBar.tipe === "pemasukan") ? 0.4 : 1} onMouseEnter={() => setHoveredBar({ bulan: d.bulan, tipe: "pemasukan", value: d.pemasukan })} onMouseLeave={() => setHoveredBar(null)} />
              <rect x={x + barWidth + barGap} y={chartHeight - hE + 10} width={barWidth} height={Math.max(hE, 0)} rx={6} fill="url(#gradE)" className="transition-all duration-700 ease-out cursor-pointer" opacity={hoveredBar && !(hoveredBar.bulan === d.bulan && hoveredBar.tipe === "pengeluaran") ? 0.4 : 1} onMouseEnter={() => setHoveredBar({ bulan: d.bulan, tipe: "pengeluaran", value: d.pengeluaran })} onMouseLeave={() => setHoveredBar(null)} />
              <text x={x + barWidth + barGap / 2} y={chartHeight + 30} textAnchor="middle" className="text-[11px] font-semibold fill-slate-500">{d.bulan}</text>
            </g>);
          })}
          <defs>
            <linearGradient id="gradP" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" /></linearGradient>
            <linearGradient id="gradE" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f43f5e" /><stop offset="100%" stopColor="#fb7185" /></linearGradient>
          </defs>
        </svg>
        {hoveredBar && (<div className="absolute top-2 left-1/2 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white shadow-lg pointer-events-none">{hoveredBar.bulan} · {hoveredBar.tipe === "pemasukan" ? "Pemasukan" : "Pengeluaran"}: {formatRupiah(hoveredBar.value)}</div>)}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50/70 p-3 text-center"><p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider">Total Pemasukan</p><p className="text-lg font-bold text-emerald-700">{formatRupiah(totalP)}</p></div>
        <div className="rounded-xl bg-rose-50/70 p-3 text-center"><p className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider">Total Pengeluaran</p><p className="text-lg font-bold text-rose-700">{formatRupiah(totalE)}</p></div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENT: Pencarian Tunggakan NIM (Supabase)
   ══════════════════════════════════════════════ */

interface TunggakanResult { nim: string; nama: string; kelas: string; status: "lunas" | "tunggakan"; items: { nama: string; nominal: number }[]; }

function PencarianTunggakan({ ormawaId }: { ormawaId: string }) {
  const [nimQuery, setNimQuery] = useState("");
  const [result, setResult] = useState<TunggakanResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nimQuery.trim()) return;
    setSearching(true); setNotFound(false); setResult(null);

    // 1. Find anggota by NIM in this ormawa
    const { data: anggota } = await supabase
      .from("anggota")
      .select("id, nim, nama_lengkap, kelas_angkatan")
      .eq("ormawa_id", ormawaId)
      .eq("nim", nimQuery.trim())
      .single();

    if (!anggota) { setNotFound(true); setSearching(false); return; }

    // 2. Get unpaid tagihan
    const { data: pembayaran } = await supabase
      .from("status_pembayaran_anggota")
      .select("lunas, tagihan_iuran(nama_iuran, nominal_tagihan)")
      .eq("anggota_id", anggota.id)
      .eq("lunas", false);

    const items = (pembayaran ?? []).map((p: Record<string, unknown>) => {
      const tagihan = p.tagihan_iuran as Record<string, unknown> | null;
      return {
        nama: (tagihan?.nama_iuran as string) ?? "Iuran",
        nominal: Number(tagihan?.nominal_tagihan ?? 0),
      };
    });

    setResult({
      nim: anggota.nim,
      nama: anggota.nama_lengkap,
      kelas: anggota.kelas_angkatan ?? "-",
      status: items.length > 0 ? "tunggakan" : "lunas",
      items,
    });
    setSearching(false);
  };

  const total = result?.items.reduce((s, t) => s + t.nominal, 0) ?? 0;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50"><IconSearch className="text-sky-500" /></div>
        <div><h2 className="text-base font-bold text-slate-800">Cek Tunggakan</h2><p className="text-xs text-slate-400">Cari berdasarkan NIM anggota</p></div>
      </div>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" />
          <input type="text" value={nimQuery} onChange={(e) => setNimQuery(e.target.value)} placeholder="Masukkan NIM Anggota..." className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-300 transition-colors focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100" />
        </div>
        <button type="submit" disabled={searching} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-all hover:shadow-sky-300 hover:brightness-110 active:scale-[0.97] disabled:opacity-60">
          {searching ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <IconSearch className="text-white" />}
          <span className="hidden sm:inline">Cari</span>
        </button>
      </form>
      {result && (
        <div className="animate-[fadeSlideIn_0.3s_ease-out]">
          <div className={`rounded-xl border-2 p-4 ${result.status === "tunggakan" ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"}`}>
            <div className="flex items-start justify-between mb-3">
              <div><p className="text-sm font-bold text-slate-800">{result.nama}</p><p className="text-xs text-slate-500">NIM: {result.nim} · {result.kelas}</p></div>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${result.status === "tunggakan" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                {result.status === "tunggakan" ? <IconWarning className="w-3 h-3" /> : <IconCheckCircle className="w-3 h-3" />}
                {result.status === "tunggakan" ? "Ada Tunggakan" : "Lunas Semua"}
              </span>
            </div>
            {result.items.length > 0 ? (<>
              <div className="space-y-2">
                {result.items.map((t, i) => (<div key={i} className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 ring-1 ring-amber-200/50"><div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-amber-400" /><span className="text-xs font-medium text-slate-600">{t.nama}</span></div><span className="text-xs font-bold text-amber-700">{formatRupiah(t.nominal)}</span></div>))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-amber-200/50 pt-3"><span className="text-xs font-semibold text-slate-500">Total Tunggakan</span><span className="text-sm font-bold text-amber-700">{formatRupiah(total)}</span></div>
            </>) : <p className="text-xs text-emerald-600 font-medium">✨ Semua iuran telah dibayar!</p>}
          </div>
        </div>
      )}
      {notFound && (
        <div className="animate-[fadeSlideIn_0.3s_ease-out] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-medium text-slate-400">😕 NIM &quot;{nimQuery}&quot; tidak ditemukan</p>
          <p className="text-xs text-slate-300 mt-1">Pastikan NIM yang dimasukkan benar</p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   COMPONENT: AI Chat Widget
   ══════════════════════════════════════════════ */

interface ChatMsg { id: string; role: "user" | "ai"; text: string; }

function AIChatWidget({ ormawaId }: { ormawaId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMin, setIsMin] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { id: "c1", role: "ai", text: "Halo! Saya asisten AI bendahara. Tanyakan apa saja seputar keuangan ormawa Anda — saya akan menjawab berdasarkan data riil dari database. 💡" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || typing || !ormawaId) return;
    const userText = input.trim();
    setMessages((p) => [...p, { id: uid(), role: "user", text: userText }]);
    setInput(""); setTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, ormawaId }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { id: uid(), role: "ai", text: data.reply }]);
    } catch {
      setMessages((p) => [...p, { id: uid(), role: "ai", text: "Maaf, terjadi kesalahan koneksi. Coba lagi." }]);
    }
    setTyping(false);
  };

  return (<>
    {!isOpen && (
      <button onClick={() => { setIsOpen(true); setIsMin(false); }} className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-xl shadow-indigo-300/40 transition-all duration-300 hover:scale-110 active:scale-95">
        <IconSpark className="text-white" />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" /><span className="relative inline-flex h-4 w-4 rounded-full bg-violet-400" /></span>
      </button>
    )}
    {isOpen && (
      <div className={`fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl transition-all duration-300 ${isMin ? "h-[52px] w-[280px]" : "h-[460px] w-[370px]"}`}>
        <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-3 cursor-pointer" onClick={() => isMin && setIsMin(false)}>
          <div className="flex items-center gap-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20"><IconSpark className="text-white w-4 h-4" /></div><div><p className="text-sm font-bold text-white leading-tight">Tanya AI Keuangan</p>{!isMin && <p className="text-[10px] text-white/70">Asisten bendahara cerdas</p>}</div></div>
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); setIsMin(!isMin); }} className="rounded-lg p-1 text-white/70 hover:bg-white/20 hover:text-white"><IconMinus /></button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="rounded-lg p-1 text-white/70 hover:bg-white/20 hover:text-white"><IconX /></button>
          </div>
        </div>
        {!isMin && (<>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${m.role === "user" ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white rounded-br-md" : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-100 rounded-bl-md"}`}>
                  {m.role === "ai" && <div className="flex items-center gap-1 mb-1"><IconSpark className="text-violet-400 w-3 h-3" /><span className="text-[10px] font-semibold text-violet-400">AI</span></div>}
                  {m.text}
                </div>
              </div>
            ))}
            {typing && <div className="flex justify-start"><div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100"><span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "0ms" }} /><span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "150ms" }} /><span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" style={{ animationDelay: "300ms" }} /></div></div>}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white p-3">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya soal keuangan..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100" />
            <button type="submit" disabled={!input.trim() || typing} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-40"><IconSend /></button>
          </form>
        </>)}
      </div>
    )}
  </>);
}

/* ══════════════════════════════════════════════
   CSV EXPORT
   ══════════════════════════════════════════════ */

async function downloadCSV(ormawaId: string) {
  const { data } = await supabase
    .from("transaksi")
    .select("*")
    .eq("ormawa_id", ormawaId)
    .order("tanggal_transaksi", { ascending: false });

  if (!data || data.length === 0) { alert("Belum ada transaksi untuk diunduh."); return; }

  const header = "Tanggal,Tipe,Kategori,Keterangan,Nominal\n";
  const rows = data.map((t) =>
    `"${formatTanggal(t.tanggal_transaksi)}","${t.tipe}","${t.kategori}","${(t.keterangan ?? "").replace(/"/g, '""')}",${t.tipe === "pengeluaran" ? "-" : ""}${t.nominal}`
  ).join("\n");

  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ══════════════════════════════════════════════ */

export default function DashboardPage() {
  const router = useRouter();
  const [ormawaId, setOrmawaId] = useState<string | null>(null);
  const [ormawaName, setOrmawaName] = useState("");
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [allTransaksi, setAllTransaksi] = useState<Transaksi[]>([]);
  const [tipe, setTipe] = useState<TipeTransaksi>("pemasukan");
  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [kategori, setKategori] = useState(KATEGORI_LIST[0]);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Auth + data fetch ──
  const fetchData = useCallback(async (oid: string) => {
    // Recent 5
    const { data: recent } = await supabase
      .from("transaksi")
      .select("*")
      .eq("ormawa_id", oid)
      .order("tanggal_transaksi", { ascending: false })
      .limit(5);

    // All (for chart)
    const { data: all } = await supabase
      .from("transaksi")
      .select("*")
      .eq("ormawa_id", oid)
      .order("tanggal_transaksi", { ascending: false });

    setTransaksiList(recent ?? []);
    setAllTransaksi(all ?? []);
  }, []);

  useEffect(() => {
    setMounted(true);

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      // Find ormawa by user email
      const { data: ormawa } = await supabase
        .from("ormawa")
        .select("id, nama_ormawa")
        .eq("email", session.user.email!)
        .single();

      if (ormawa) {
        setOrmawaId(ormawa.id);
        setOrmawaName(ormawa.nama_ormawa);
        await fetchData(ormawa.id);
      } else {
        // Auto-create ormawa for new users
        const { data: newOrmawa } = await supabase
          .from("ormawa")
          .insert({ nama_ormawa: session.user.email!.split("@")[0], email: session.user.email! })
          .select()
          .single();

        if (newOrmawa) {
          setOrmawaId(newOrmawa.id);
          setOrmawaName(newOrmawa.nama_ormawa);
        }
      }
      setLoading(false);
    };

    init();
  }, [router, fetchData]);

  // ── Submit transaksi to Supabase ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ormawaId) return;
    const nominalNum = parseInt(nominal.replace(/\D/g, ""), 10);
    if (!nominalNum || nominalNum <= 0) return;

    const { error } = await supabase.from("transaksi").insert({
      ormawa_id: ormawaId,
      tipe,
      nominal: nominalNum,
      keterangan: keterangan || null,
      kategori,
      tanggal_transaksi: new Date().toISOString(),
      bukti_nota_url: null,
    });

    if (error) { alert("Gagal menyimpan: " + error.message); return; }

    setNominal(""); setKeterangan(""); setKategori(KATEGORI_LIST[0]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    await fetchData(ormawaId);
  };

  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) { setNominal(""); return; }
    setNominal(parseInt(raw, 10).toLocaleString("id-ID"));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="h-10 w-10 mx-auto animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
          <p className="mt-4 text-sm text-slate-400 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200"><IconWallet className="text-white" /></div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Dashboard Bendahara</h1>
              <p className="text-xs text-slate-400 font-medium">{ormawaName || "Sistem Keuangan Ormawa"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Download CSV */}
            <button onClick={() => ormawaId && downloadCSV(ormawaId)} className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.97]">
              <IconDownload className="w-4 h-4" />
              Unduh Laporan (CSV)
            </button>
            {/* Mobile download */}
            <button onClick={() => ormawaId && downloadCSV(ormawaId)} className="sm:hidden flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-500 hover:border-indigo-300 hover:text-indigo-600">
              <IconDownload className="w-4 h-4" />
            </button>
            {/* Billing */}
            <Link href="/dashboard/billing" className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700 transition-all hover:border-amber-300 hover:bg-amber-100 active:scale-[0.97]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 4-6 4 6 4-4-2 10H4L2 8z" /></svg>
              Langganan
            </Link>
            {/* Status */}
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
            </span>
            {/* Logout */}
            <button onClick={handleLogout} className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-400 transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500" title="Keluar">
              <IconLogout />
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 pb-24">
        <SaldoCards transaksi={allTransaksi} />

        {/* Row: Form + Riwayat */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mb-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 hover:shadow-md transition-shadow">
              <div className="mb-6 flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50"><IconPlus className="text-indigo-500" /></div><div><h2 className="text-base font-bold text-slate-800">Transaksi Baru</h2><p className="text-xs text-slate-400">Catat pemasukan atau pengeluaran</p></div></div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <fieldset>
                  <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Tipe Transaksi</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(["pemasukan", "pengeluaran"] as TipeTransaksi[]).map((t) => {
                      const active = tipe === t; const isIn = t === "pemasukan";
                      return (<button key={t} type="button" onClick={() => setTipe(t)} className={`group flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all duration-200 ${active ? isIn ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-100" : "border-rose-500 bg-rose-50 text-rose-700 shadow-sm shadow-rose-100" : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-500"}`}>
                        {isIn ? <IconArrowDown className={active ? "text-emerald-500" : "text-slate-300 group-hover:text-slate-400"} /> : <IconArrowUp className={active ? "text-rose-500" : "text-slate-300 group-hover:text-slate-400"} />}
                        <span className="capitalize">{t}</span>
                      </button>);
                    })}
                  </div>
                </fieldset>
                <div><label htmlFor="nominal" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Nominal</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">Rp</span><input id="nominal" type="text" inputMode="numeric" value={nominal} onChange={handleNominalChange} placeholder="0" required className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div></div>
                <div><label htmlFor="keterangan" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Keterangan</label><input id="keterangan" type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Contoh: Beli air minum rapat" className="w-full rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100" /></div>
                <div><label htmlFor="kategori" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Kategori</label><div className="relative"><select id="kategori" value={kategori} onChange={(e) => setKategori(e.target.value)} className="w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50/50 px-4 py-3 pr-10 text-sm font-medium text-slate-700 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100">{KATEGORI_LIST.map((k) => <option key={k} value={k}>{k}</option>)}</select><svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></div></div>
                <button type="submit" disabled={submitted} className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold shadow-lg transition-all duration-300 ${submitted ? "bg-emerald-500 text-white shadow-emerald-200" : tipe === "pemasukan" ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200 hover:shadow-emerald-300 hover:brightness-110 active:scale-[0.98]" : "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-200 hover:shadow-rose-300 hover:brightness-110 active:scale-[0.98]"}`}>
                  {submitted ? <><IconCheck /><span>Tersimpan!</span></> : <><IconPlus /><span>Simpan Transaksi</span></>}
                </button>
              </form>
            </div>
          </div>

          {/* Riwayat */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-100 hover:shadow-md transition-shadow">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50"><IconReceipt className="text-violet-500" /></div><div><h2 className="text-base font-bold text-slate-800">Riwayat Transaksi</h2><p className="text-xs text-slate-400">5 transaksi terakhir</p></div></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{allTransaksi.length} total</span>
              </div>
              {transaksiList.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-10 text-center">
                  <p className="text-sm text-slate-400">Belum ada transaksi</p>
                  <p className="text-xs text-slate-300 mt-1">Mulai catat pemasukan atau pengeluaran pertama Anda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transaksiList.map((t, i) => {
                    const isIn = t.tipe === "pemasukan";
                    return (
                      <div key={t.id} className="group flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm" style={{ animationDelay: `${i * 60}ms`, animation: "fadeSlideIn 0.4s ease-out both" }}>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${isIn ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>{isIn ? <IconArrowDown /> : <IconArrowUp />}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-700">{t.keterangan || "(tanpa keterangan)"}</p>
                          <div className="mt-0.5 flex items-center gap-2"><span className="text-xs text-slate-400">{formatTanggal(t.tanggal_transaksi)}</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">{t.kategori}</span></div>
                        </div>
                        <div className="shrink-0 text-right"><p className={`text-sm font-bold tracking-tight ${isIn ? "text-emerald-600" : "text-rose-600"}`}>{isIn ? "+" : "-"} {formatRupiah(Number(t.nominal))}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row: Chart + Tunggakan */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FinanceBarChart transaksi={allTransaksi} />
          {ormawaId && <PencarianTunggakan ormawaId={ormawaId} />}
        </div>
      </main>

      <AIChatWidget ormawaId={ormawaId} />

      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}

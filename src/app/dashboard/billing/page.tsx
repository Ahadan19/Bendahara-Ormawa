"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { Ormawa } from "@/types/database";
import Script from "next/script";

/* ══════════════════════════════════════════════
   Halaman Billing — Status & Perpanjang Langganan
   ══════════════════════════════════════════════ */

// Declare Snap on window
declare global {
  interface Window {
    snap?: {
      pay: (token: string, options: {
        onSuccess?: (result: Record<string, string>) => void;
        onPending?: (result: Record<string, string>) => void;
        onError?: (result: Record<string, string>) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

const PRICE = 150_000;

function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function formatTanggal(d: string): string {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));
}

function daysUntil(d: string): number {
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/* ── Icons ── */
function IconCrown({ className = "" }: { className?: string }) {
  return (<svg className={className} width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M2 8l4 4 4-6 4 6 4-4-2 10H4L2 8z" /></svg>);
}
function IconShield({ className = "" }: { className?: string }) {
  return (<svg className={className} width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
}
function IconCheck({ className = "" }: { className?: string }) {
  return (<svg className={className} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);
}
function IconArrowLeft({ className = "" }: { className?: string }) {
  return (<svg className={className} width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>);
}
function IconWallet({ className = "" }: { className?: string }) {
  return (<svg className={className} width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 12a1 1 0 102 0 1 1 0 00-2 0z" /></svg>);
}

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ormawa, setOrmawa] = useState<Ormawa | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setPaymentStatus(searchParams.get("status"));

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      setUserEmail(session.user.email!);

      const { data } = await supabase
        .from("ormawa")
        .select("*")
        .eq("email", session.user.email!)
        .single();

      if (data) setOrmawa(data);
      setLoading(false);
    };
    init();
  }, [router, searchParams]);

  const handlePay = async () => {
    if (!ormawa || paying) return;
    setPaying(true);

    try {
      const res = await fetch("/api/midtrans/create-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ormawaId: ormawa.id,
          ormawaName: ormawa.nama_ormawa,
          email: userEmail,
        }),
      });

      const data = await res.json();

      if (data.error) {
        alert(data.error);
        setPaying(false);
        return;
      }

      // Open Midtrans Snap popup
      if (window.snap) {
        window.snap.pay(data.token, {
          onSuccess: async () => {
            setPaymentStatus("success");
            // Refresh ormawa data
            const { data: updated } = await supabase
              .from("ormawa")
              .select("*")
              .eq("id", ormawa.id)
              .single();
            if (updated) setOrmawa(updated);
            setPaying(false);
          },
          onPending: () => {
            setPaymentStatus("pending");
            setPaying(false);
          },
          onError: () => {
            setPaymentStatus("error");
            setPaying(false);
          },
          onClose: () => {
            setPaying(false);
          },
        });
      } else {
        // Fallback: redirect to Midtrans payment page
        window.open(data.redirect_url, "_blank");
        setPaying(false);
      }
    } catch {
      alert("Gagal memproses pembayaran. Coba lagi.");
      setPaying(false);
    }
  };

  const isActive = ormawa?.status_langganan === "aktif" && ormawa?.tanggal_berakhir_langganan && new Date(ormawa.tanggal_berakhir_langganan) > new Date();
  const daysLeft = ormawa?.tanggal_berakhir_langganan ? daysUntil(ormawa.tanggal_berakhir_langganan) : 0;
  const isExpiringSoon = isActive && daysLeft <= 30;

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" /></div>);
  }

  return (
    <div className={`min-h-screen bg-slate-50 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}>
      {/* Midtrans Snap JS */}
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/dashboard")} className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all">
              <IconArrowLeft />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-200"><IconWallet className="text-white" /></div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">Langganan</h1>
              <p className="text-xs text-slate-400 font-medium">{ormawa?.nama_ormawa}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Success/Pending/Error banners */}
        {paymentStatus === "success" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 animate-[fadeSlideIn_0.3s_ease-out]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100"><IconCheck className="text-emerald-600 w-5 h-5" /></div>
            <div><p className="text-sm font-bold text-emerald-800">Pembayaran Berhasil!</p><p className="text-xs text-emerald-600">Langganan Anda telah diperpanjang 6 bulan.</p></div>
          </div>
        )}
        {paymentStatus === "pending" && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 animate-[fadeSlideIn_0.3s_ease-out]">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100"><span className="text-xl">⏳</span></div>
            <div><p className="text-sm font-bold text-amber-800">Pembayaran Pending</p><p className="text-xs text-amber-600">Selesaikan pembayaran Anda. Status akan diperbarui otomatis.</p></div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* ── Current Plan Card ── */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isActive ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-slate-200"}`}>
                <IconCrown className={isActive ? "text-white" : "text-slate-400"} />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Status Langganan</h2>
                <p className="text-xs text-slate-400">Paket Ormawa Finance</p>
              </div>
            </div>

            <div className={`rounded-xl border-2 p-4 mb-4 ${
              isActive
                ? isExpiringSoon ? "border-amber-200 bg-amber-50/50" : "border-emerald-200 bg-emerald-50/50"
                : "border-slate-200 bg-slate-50"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Status</span>
                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                  isActive
                    ? isExpiringSoon ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500"
                }`}>
                  {isActive ? (isExpiringSoon ? "Segera Berakhir" : "Aktif") : (ormawa?.status_langganan ?? "Nonaktif")}
                </span>
              </div>
              {ormawa?.tanggal_berakhir_langganan && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Berlaku hingga</span>
                  <span className="text-sm font-semibold text-slate-700">{formatTanggal(ormawa.tanggal_berakhir_langganan)}</span>
                </div>
              )}
              {isActive && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Sisa waktu</span>
                  <span className={`text-sm font-bold ${isExpiringSoon ? "text-amber-600" : "text-emerald-600"}`}>{daysLeft} hari</span>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="space-y-2.5">
              {["Pencatatan transaksi unlimited", "Grafik kesehatan keuangan", "Pencarian tunggakan NIM", "Asisten AI bendahara", "Export laporan CSV untuk LPJ", "Multi-user per ormawa"].map((f) => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100"><IconCheck className="text-emerald-600 w-3 h-3" /></div>
                  <span className="text-sm text-slate-600">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Payment Card ── */}
          <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 mb-4">
                <IconShield className="text-white" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800">Perpanjang Langganan</h2>
              <p className="text-sm text-slate-500 mt-1">Akses penuh selama 6 bulan</p>
            </div>

            {/* Price */}
            <div className="rounded-xl bg-white border border-indigo-100 p-5 mb-6 text-center">
              <p className="text-4xl font-extrabold text-indigo-600 tracking-tight">{formatRupiah(PRICE)}</p>
              <p className="text-sm text-slate-400 mt-1">/ 6 bulan</p>
              <p className="text-xs text-slate-400 mt-0.5">Setara {formatRupiah(Math.round(PRICE / 6))}/bulan</p>
            </div>

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={paying}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-300 hover:shadow-indigo-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {paying ? (
                <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /><span>Memproses...</span></>
              ) : (
                <><IconShield className="w-5 h-5" /><span>Perpanjang Langganan ({formatRupiah(PRICE)}/6 Bulan)</span></>
              )}
            </button>

            {/* Payment methods hint */}
            <div className="mt-4 text-center">
              <p className="text-[10px] text-slate-400 mb-2">Metode pembayaran tersedia</p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {["QRIS", "GoPay", "BCA VA", "BNI VA", "Mandiri", "BRI"].map((m) => (
                  <span key={m} className="rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200">{m}</span>
                ))}
              </div>
            </div>

            {/* Security note */}
            <div className="mt-6 flex items-start gap-2 rounded-lg bg-white/80 p-3">
              <IconShield className="text-emerald-500 w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pembayaran diproses secara aman melalui <strong className="text-slate-700">Midtrans</strong>. Data kartu Anda tidak disimpan di server kami.
                {" "}Saat ini menggunakan <strong className="text-indigo-600">mode Sandbox</strong> (testing).
              </p>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

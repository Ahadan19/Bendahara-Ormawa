"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Redirect if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(
        authError.message === "Invalid login credentials"
          ? "Email atau password salah. Silakan coba lagi."
          : authError.message
      );
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Masukkan email dan password terlebih dahulu.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setError("");
    alert("Akun berhasil dibuat! Silakan cek email untuk verifikasi, lalu login.");
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex transition-opacity duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}>

      {/* ── Left: Branding Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700">
        {/* Decorative shapes */}
        <div className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute bottom-10 left-10 h-48 w-48 rounded-full bg-white/5" />
        <div className="absolute bottom-1/4 right-1/4 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          {/* Logo */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg mb-8">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a1 1 0 102 0 1 1 0 00-2 0z" />
            </svg>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-4">
            Sistem Keuangan<br />Ormawa
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-md mb-10">
            Platform pencatatan keuangan organisasi mahasiswa yang cepat, transparan, dan akuntabel.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {[
              { icon: "📊", text: "Grafik kesehatan keuangan real-time" },
              { icon: "🔍", text: "Pelacakan tunggakan per NIM" },
              { icon: "📥", text: "Export laporan untuk LPJ" },
              { icon: "🤖", text: "Asisten AI bendahara" },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-xl">{f.icon}</span>
                <span className="text-sm text-white/80 font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 mb-4">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2v-1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a1 1 0 102 0 1 1 0 00-2 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Sistem Keuangan Ormawa</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Masuk ke Akun</h2>
            <p className="text-sm text-slate-500 mt-1">
              Kelola keuangan ormawa Anda dengan aman
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 animate-[fadeSlideIn_0.25s_ease-out]">
              <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Email Ormawa
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bendahara@ormawa.ac.id"
                  required
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm text-slate-700 placeholder:text-slate-300 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white py-3.5 pl-12 pr-12 text-sm text-slate-700 placeholder:text-slate-300 transition-colors focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition-all duration-300 hover:shadow-indigo-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  <span>Masuk ke Dashboard</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 px-3 text-xs text-slate-400 font-medium">Belum punya akun?</span>
              </div>
            </div>

            {/* Sign Up Button */}
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-600 active:scale-[0.98] disabled:opacity-60"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              <span>Daftar Akun Baru</span>
            </button>
          </form>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 Sistem Keuangan Ormawa. Semua hak dilindungi.
          </p>
        </div>
      </div>

      {/* ── Animations ── */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

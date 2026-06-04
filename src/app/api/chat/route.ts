import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════════
   AI Chat API Route — RAG (Retrieval-Augmented Generation)
   
   Flow:
   1. Terima pertanyaan + ormawa_id dari client
   2. Query ringkasan data keuangan dari Supabase
   3. Bangun prompt dengan konteks data riil
   4. Kirim ke Google Gemini API
   5. Return respons AI
   ══════════════════════════════════════════════ */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiKey = process.env.GEMINI_API_KEY!;

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

// ── Helper: Ambil ringkasan keuangan dari Supabase ──
async function getFinancialContext(ormawaId: string): Promise<string> {
  const sb = createClient(supabaseUrl, supabaseKey);

  // 1. Info ormawa
  const { data: ormawa } = await sb
    .from("ormawa")
    .select("nama_ormawa, status_langganan, tanggal_berakhir_langganan")
    .eq("id", ormawaId)
    .single();

  // 2. Semua transaksi
  const { data: transaksi } = await sb
    .from("transaksi")
    .select("tipe, nominal, kategori, keterangan, tanggal_transaksi")
    .eq("ormawa_id", ormawaId)
    .order("tanggal_transaksi", { ascending: false });

  if (!transaksi || transaksi.length === 0) {
    return `Ormawa: ${ormawa?.nama_ormawa ?? "Tidak diketahui"}. Belum ada data transaksi.`;
  }

  // 3. Hitung ringkasan
  const totalPemasukan = transaksi
    .filter((t) => t.tipe === "pemasukan")
    .reduce((s, t) => s + Number(t.nominal), 0);
  const totalPengeluaran = transaksi
    .filter((t) => t.tipe === "pengeluaran")
    .reduce((s, t) => s + Number(t.nominal), 0);
  const saldo = totalPemasukan - totalPengeluaran;

  // 4. Breakdown per kategori
  const kategoriMap: Record<string, { masuk: number; keluar: number }> = {};
  for (const t of transaksi) {
    if (!kategoriMap[t.kategori]) {
      kategoriMap[t.kategori] = { masuk: 0, keluar: 0 };
    }
    if (t.tipe === "pemasukan") {
      kategoriMap[t.kategori].masuk += Number(t.nominal);
    } else {
      kategoriMap[t.kategori].keluar += Number(t.nominal);
    }
  }

  const kategoriDetail = Object.entries(kategoriMap)
    .map(([kat, val]) => `  - ${kat}: Masuk Rp ${val.masuk.toLocaleString("id-ID")}, Keluar Rp ${val.keluar.toLocaleString("id-ID")}`)
    .join("\n");

  // 5. Bulan ini
  const now = new Date();
  const bulanIni = transaksi.filter((t) => {
    const d = new Date(t.tanggal_transaksi);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const pemasukanBulanIni = bulanIni.filter((t) => t.tipe === "pemasukan").reduce((s, t) => s + Number(t.nominal), 0);
  const pengeluaranBulanIni = bulanIni.filter((t) => t.tipe === "pengeluaran").reduce((s, t) => s + Number(t.nominal), 0);

  // 6. 5 transaksi terakhir
  const last5 = transaksi.slice(0, 5).map((t) =>
    `  - [${t.tanggal_transaksi.slice(0, 10)}] ${t.tipe.toUpperCase()}: Rp ${Number(t.nominal).toLocaleString("id-ID")} — ${t.keterangan ?? t.kategori}`
  ).join("\n");

  // 7. Jumlah anggota & tunggakan
  const { count: jumlahAnggota } = await sb
    .from("anggota")
    .select("id", { count: "exact", head: true })
    .eq("ormawa_id", ormawaId);

  const { count: jumlahTunggakan } = await sb
    .from("status_pembayaran_anggota")
    .select("id", { count: "exact", head: true })
    .eq("lunas", false);

  return `
=== DATA KEUANGAN ORMAWA ===
Organisasi: ${ormawa?.nama_ormawa ?? "-"}
Status Langganan: ${ormawa?.status_langganan ?? "-"}
Jumlah Anggota: ${jumlahAnggota ?? 0}
Jumlah Tunggakan Belum Lunas: ${jumlahTunggakan ?? 0}

--- RINGKASAN KESELURUHAN ---
Total Pemasukan: Rp ${totalPemasukan.toLocaleString("id-ID")}
Total Pengeluaran: Rp ${totalPengeluaran.toLocaleString("id-ID")}
Saldo Saat Ini: Rp ${saldo.toLocaleString("id-ID")}
Jumlah Transaksi: ${transaksi.length}

--- BULAN INI ---
Pemasukan Bulan Ini: Rp ${pemasukanBulanIni.toLocaleString("id-ID")}
Pengeluaran Bulan Ini: Rp ${pengeluaranBulanIni.toLocaleString("id-ID")}

--- BREAKDOWN PER KATEGORI ---
${kategoriDetail}

--- 5 TRANSAKSI TERAKHIR ---
${last5}
`.trim();
}

// ── POST Handler ──
export async function POST(request: NextRequest) {
  try {
    const { message, ormawaId } = await request.json();

    if (!message || !ormawaId) {
      return NextResponse.json({ error: "message dan ormawaId diperlukan" }, { status: 400 });
    }

    if (!geminiKey || geminiKey === "your-gemini-api-key-here") {
      return NextResponse.json({
        reply: "⚠️ API Key Gemini belum dikonfigurasi. Silakan isi GEMINI_API_KEY di file .env.local agar AI bisa merespons berdasarkan data riil.",
      });
    }

    // 1. Ambil konteks data dari Supabase
    const context = await getFinancialContext(ormawaId);

    // 2. Bangun prompt untuk Gemini
    const systemPrompt = `Kamu adalah "Asisten AI Bendahara", asisten keuangan cerdas untuk organisasi kemahasiswaan (ormawa). 

ATURAN:
- Jawab HANYA berdasarkan data yang diberikan di bawah. JANGAN mengarang angka.
- Gunakan bahasa Indonesia yang ramah dan profesional.
- Format angka uang dalam Rupiah (Rp).
- Jika data tidak cukup untuk menjawab, katakan dengan jujur.
- Berikan saran keuangan yang relevan jika memungkinkan.
- Jawab dengan ringkas (maks 3-4 kalimat) kecuali diminta detail.

${context}`;

    // 3. Kirim ke Gemini API
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\nPertanyaan bendahara: " + message }] },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json({
        reply: "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.",
      });
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Maaf, saya tidak bisa memproses pertanyaan Anda saat ini.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { reply: "Terjadi kesalahan internal. Silakan coba lagi." },
      { status: 500 }
    );
  }
}

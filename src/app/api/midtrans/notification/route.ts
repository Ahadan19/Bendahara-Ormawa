import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════════
   Midtrans Webhook — Payment Notification Handler
   
   Dipanggil oleh Midtrans saat status pembayaran berubah.
   Jika settlement → update tanggal_berakhir_langganan +6 bulan
   ══════════════════════════════════════════════ */

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Verifikasi signature dari Midtrans
function verifySignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string,
  signatureKey: string
): boolean {
  const payload = orderId + statusCode + grossAmount + serverKey;
  const hash = crypto.createHash("sha512").update(payload).digest("hex");
  return hash === signatureKey;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      custom_field1: ormawaId,
    } = body;

    // 1. Verifikasi signature untuk keamanan
    const isValid = verifySignature(
      order_id,
      status_code,
      gross_amount,
      MIDTRANS_SERVER_KEY,
      signature_key
    );

    if (!isValid) {
      console.error("Invalid Midtrans signature for order:", order_id);
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 2. Proses berdasarkan status
    if (
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept")
    ) {
      // Pembayaran berhasil — perpanjang langganan +6 bulan
      const sb = createClient(supabaseUrl, supabaseKey);

      // Ambil tanggal berakhir saat ini
      const { data: ormawa } = await sb
        .from("ormawa")
        .select("tanggal_berakhir_langganan")
        .eq("id", ormawaId)
        .single();

      // Hitung tanggal baru: mulai dari sekarang atau dari tanggal berakhir lama (mana yang lebih baru)
      const sekarang = new Date();
      const existing = ormawa?.tanggal_berakhir_langganan
        ? new Date(ormawa.tanggal_berakhir_langganan)
        : sekarang;
      const startDate = existing > sekarang ? existing : sekarang;
      const newExpiry = new Date(startDate);
      newExpiry.setMonth(newExpiry.getMonth() + 6);

      // Update database
      const { error } = await sb
        .from("ormawa")
        .update({
          status_langganan: "aktif",
          tanggal_berakhir_langganan: newExpiry.toISOString(),
        })
        .eq("id", ormawaId);

      if (error) {
        console.error("Failed to update subscription:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(`✅ Subscription extended for ormawa ${ormawaId} until ${newExpiry.toISOString()}`);
    } else if (
      transaction_status === "deny" ||
      transaction_status === "cancel" ||
      transaction_status === "expire"
    ) {
      console.log(`❌ Payment ${transaction_status} for order ${order_id}`);
    } else if (transaction_status === "pending") {
      console.log(`⏳ Payment pending for order ${order_id}`);
    }

    // Midtrans expects 200 OK
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

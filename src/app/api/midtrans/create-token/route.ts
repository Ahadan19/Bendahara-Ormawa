import { NextRequest, NextResponse } from "next/server";

/* ══════════════════════════════════════════════
   Midtrans Snap — Create Transaction Token
   
   Dipanggil dari client saat user klik "Perpanjang Langganan"
   Mengembalikan Snap token untuk membuka popup pembayaran
   ══════════════════════════════════════════════ */

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const SNAP_URL = "https://app.sandbox.midtrans.com/snap/v1/transactions";

// Harga langganan 6 bulan
const SUBSCRIPTION_PRICE = 150_000;
const SUBSCRIPTION_LABEL = "Langganan Ormawa Finance - 6 Bulan";

export async function POST(request: NextRequest) {
  try {
    const { ormawaId, ormawaName, email } = await request.json();

    if (!ormawaId || !email) {
      return NextResponse.json({ error: "ormawaId dan email diperlukan" }, { status: 400 });
    }

    if (!MIDTRANS_SERVER_KEY || MIDTRANS_SERVER_KEY === "SB-Mid-server-xxxx") {
      return NextResponse.json(
        { error: "Midtrans Server Key belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY di .env.local" },
        { status: 500 }
      );
    }

    // Generate unique order ID
    const orderId = `ORMAWA-${ormawaId.slice(0, 8)}-${Date.now()}`;

    // Build Snap transaction payload
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: SUBSCRIPTION_PRICE,
      },
      item_details: [
        {
          id: "SUBSCRIPTION_6M",
          price: SUBSCRIPTION_PRICE,
          quantity: 1,
          name: SUBSCRIPTION_LABEL,
        },
      ],
      customer_details: {
        email: email,
        first_name: ormawaName || "Bendahara",
      },
      // Metadata — digunakan di webhook untuk update database
      custom_field1: ormawaId,
      callbacks: {
        finish: `${request.nextUrl.origin}/dashboard/billing?status=success`,
        error: `${request.nextUrl.origin}/dashboard/billing?status=error`,
        pending: `${request.nextUrl.origin}/dashboard/billing?status=pending`,
      },
    };

    // Call Midtrans Snap API
    const authString = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");

    const response = await fetch(SNAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Midtrans API error:", errText);
      return NextResponse.json(
        { error: "Gagal membuat transaksi Midtrans" },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      token: data.token,
      redirect_url: data.redirect_url,
      order_id: orderId,
    });
  } catch (err) {
    console.error("Create token error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}

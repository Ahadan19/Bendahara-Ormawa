/* ══════════════════════════════════════════════
   TypeScript types yang matching dengan schema SQL
   di supabase/migrations/00001_initial_schema.sql
   ══════════════════════════════════════════════ */

export type TipeTransaksi = "pemasukan" | "pengeluaran";
export type StatusLangganan = "aktif" | "trial" | "nonaktif" | "kadaluarsa";

export interface Ormawa {
  id: string;
  nama_ormawa: string;
  email: string;
  status_langganan: StatusLangganan;
  tanggal_berakhir_langganan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Anggota {
  id: string;
  ormawa_id: string;
  nim: string;
  nama_lengkap: string;
  kelas_angkatan: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaksi {
  id: string;
  ormawa_id: string;
  tipe: TipeTransaksi;
  nominal: number;
  keterangan: string | null;
  kategori: string;
  tanggal_transaksi: string;
  bukti_nota_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface TagihanIuran {
  id: string;
  ormawa_id: string;
  nama_iuran: string;
  nominal_tagihan: number;
  created_at: string;
  updated_at: string;
}

export interface StatusPembayaranAnggota {
  id: string;
  anggota_id: string;
  tagihan_id: string;
  lunas: boolean;
  tanggal_bayar: string | null;
  created_at: string;
  updated_at: string;
}

/* ── Supabase Database type helper ── */

export interface Database {
  public: {
    Tables: {
      ormawa: {
        Row: Ormawa;
        Insert: Omit<Ormawa, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Ormawa, "id" | "created_at" | "updated_at">>;
      };
      anggota: {
        Row: Anggota;
        Insert: Omit<Anggota, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Anggota, "id" | "created_at" | "updated_at">>;
      };
      transaksi: {
        Row: Transaksi;
        Insert: Omit<Transaksi, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Transaksi, "id" | "created_at" | "updated_at">>;
      };
      tagihan_iuran: {
        Row: TagihanIuran;
        Insert: Omit<TagihanIuran, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<TagihanIuran, "id" | "created_at" | "updated_at">>;
      };
      status_pembayaran_anggota: {
        Row: StatusPembayaranAnggota;
        Insert: Omit<StatusPembayaranAnggota, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<StatusPembayaranAnggota, "id" | "created_at" | "updated_at">>;
      };
    };
  };
}

/* ── Joined types untuk query kompleks ── */

export interface TunggakanAnggota {
  anggota_id: string;
  nim: string;
  nama_lengkap: string;
  kelas_angkatan: string | null;
  tagihan_id: string;
  nama_iuran: string;
  nominal_tagihan: number;
  lunas: boolean;
  tanggal_bayar: string | null;
}

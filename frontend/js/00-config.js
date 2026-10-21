// js/00-config.js — Konstanta & referensi: S, CATS, PRODI_FAKULTAS/LIST, prodiOpts, LOCS.
// Opsi A: script klasik berurutan. Urutan load di frontend/index.html. Jangan load satuan.
/* DEADCODE DIBUANG: const NOW + helper d() — d() tak pernah dipanggil, NOW hanya dipakai d(). */
const S = {
  PENDING: "Menunggu verifikasi",
  ACTIVE: "Aktif di forum",
  FOUND: "Barang ditemukan",
  RETURNED: "Sudah dikembalikan",
  REJECTED: "Ditolak",
  EXPIRED: "Kedaluwarsa",
  PENDING_APPROVAL: "Menunggu ACC Admin",
  APPROVED: "Disetujui (Tersimpan)",
  MATCHED: "Dicocokkan",
};

const CATS = [
  "Dompet dan tas",
  "Elektronik",
  "Dokumen dan kartu",
  "Kunci",
  "Pakaian dan aksesori",
  "Alat tulis dan buku",
  "Lainnya",
];

const PRODI_FAKULTAS = [
  {
    fakultas: "Fakultas Teknik & Ilmu Komputer",
    prodi: [
      "S-2 Ilmu Komputer",
      "S-1 Teknik Informatika",
      "S-1 Sistem Informasi",
      "S-1 Rekayasa Perangkat Lunak",
      "S-1 Teknik Industri",
      "S-1 Teknik Sistem Komputer",
      "S-1 Ilmu Komputer",
      "D-3 Sistem Informasi",
    ],
  },
  {
    fakultas: "Fakultas Ekonomi & Bisnis",
    prodi: ["S-1 Manajemen", "S-1 Akuntansi", "S-1 Perbankan Syariah"],
  },
  {
    fakultas: "Fakultas Seni & Desain",
    prodi: [
      "S-1 Desain Komunikasi Visual (DKV)",
      "S-1 Film dan Televisi",
      "S-1 Desain Interior",
    ],
  },
  {
    fakultas: "Fakultas Ilmu Sosial & Kependidikan",
    prodi: ["S-1 Hubungan Internasional", "S-1 Pendidikan Bahasa Inggris"],
  },
  { fakultas: "Fakultas Psikologi", prodi: ["S-1 Psikologi"] },
  { fakultas: "Fakultas Hukum", prodi: ["S-1 Hukum"] },
];

const PRODI_LIST = PRODI_FAKULTAS.flatMap((f) => f.prodi);

const prodiOpts = () =>
  PRODI_FAKULTAS.map(
    (f) =>
      `<optgroup label="${f.fakultas}">${f.prodi.map((p) => `<option value="${p}">${p}</option>`).join("")}</optgroup>`,
  ).join("");

const LOCS = [
  "Gedung A - Ruang kelas",
  "Gedung A - Toilet lantai 1",
  "Gedung A - Toilet lantai 2",
  "Gedung A - Toilet lantai 3",
  "Gedung A - Toilet lantai 4",
  "Gedung A - Musholah lantai 1",
  "Gedung A - Musholah lantai 2",
  "Gedung A - Musholah lantai 3",
  "Gedung A - Musholah lantai 4",
  "Gedung A - Parkiran belakang",
  "Gedung A - Lab 1",
  "Gedung A - Lab 2",
  "Gedung A - Lab 3",
  "Gedung A - Lab 4",
  "Gedung A - Lab Teknik Industri",
  "Gedung A - Ruang pertemuan",
  "Gedung A - Ruang inkubator",
  "Gedung A - Poliklinik",
  "Gedung A - Lainnya",
  "Gedung B - Ruang kelas",
  "Gedung B - Toilet lantai 1",
  "Gedung B - Toilet lantai 2",
  "Gedung B - Toilet lantai 3",
  "Gedung B - Toilet lantai 4",
  "Gedung B - Musholah lantai 1",
  "Gedung B - Musholah lantai 2",
  "Gedung B - Musholah lantai 4",
  "Gedung B - Parkiran",
  "Gedung B - Perpustakaan",
  "Gedung B - Galeri FSD",
  "Gedung B - Ruang pertemuan",
  "Gedung B - Poliklinik",
  "Gedung B - Galeri investasi",
  "Gedung B - Studio FTV",
  "Gedung B - Bank Sumut",
  "Gedung B - Aula",
  "Gedung B - Microteaching",
  "Gedung B - Lab HI",
  "Gedung B - LIFT",
  "Gedung B - Bioskop",
  "Gedung B - Lainnya",
];

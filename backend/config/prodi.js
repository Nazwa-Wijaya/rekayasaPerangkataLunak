// PRD §3: daftar program studi valid (satu sumber, dipakai backend + frontend).
// Nilai yang disimpan = "Jenjang Nama Prodi", contoh: "S-1 Teknik Informatika".
const PRODI_FAKULTAS = [
  {
    fakultas: 'Fakultas Teknik & Ilmu Komputer',
    prodi: [
      'S-2 Ilmu Komputer',
      'S-1 Teknik Informatika',
      'S-1 Sistem Informasi',
      'S-1 Rekayasa Perangkat Lunak',
      'S-1 Teknik Industri',
      'S-1 Teknik Sistem Komputer',
      'S-1 Ilmu Komputer',
      'D-3 Sistem Informasi',
    ],
  },
  {
    fakultas: 'Fakultas Ekonomi & Bisnis',
    prodi: ['S-1 Manajemen', 'S-1 Akuntansi', 'S-1 Perbankan Syariah'],
  },
  {
    fakultas: 'Fakultas Seni & Desain',
    prodi: [
      'S-1 Desain Komunikasi Visual (DKV)',
      'S-1 Film dan Televisi',
      'S-1 Desain Interior',
    ],
  },
  {
    fakultas: 'Fakultas Ilmu Sosial & Kependidikan',
    prodi: ['S-1 Hubungan Internasional', 'S-1 Pendidikan Bahasa Inggris'],
  },
  { fakultas: 'Fakultas Psikologi', prodi: ['S-1 Psikologi'] },
  { fakultas: 'Fakultas Hukum', prodi: ['S-1 Hukum'] },
];

const PRODI_LIST = PRODI_FAKULTAS.flatMap((f) => f.prodi);

const isValidProdi = (v) => PRODI_LIST.includes(v);

module.exports = { PRODI_FAKULTAS, PRODI_LIST, isValidProdi };

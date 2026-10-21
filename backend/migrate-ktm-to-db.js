// Migrasi sekali jalan: pindahkan file KTM lama (backend/uploads/ktm/*)
// ke kolom users.ktm_photo sebagai base64 data URL.
// Cara pakai: pastikan Laragon/MySQL menyala, lalu dari folder backend:
//    node migrate-ktm-to-db.js
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const KTM_DIR = path.join(__dirname, 'uploads', 'ktm');
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

(async () => {
  try {
    await db.query('ALTER TABLE users MODIFY ktm_photo MEDIUMTEXT NULL');
    console.log('[1/3] kolom ktm_photo -> MEDIUMTEXT OK');
  } catch (e) {
    console.log('[1/3] alter dilewati:', e.message);
  }

  if (!fs.existsSync(KTM_DIR)) {
    console.log('[2/3] folder uploads/ktm tidak ada, tidak ada yang dimigrasi.');
    process.exit(0);
  }

  const files = fs.readdirSync(KTM_DIR).filter((f) => {
    try { return fs.statSync(path.join(KTM_DIR, f)).isFile(); } catch (_) { return false; }
  });
  console.log(`[2/3] ditemukan ${files.length} file di uploads/ktm`);

  let ok = 0;
  for (const file of files) {
    const [rows] = await db.query('SELECT id, ktm_photo FROM users WHERE ktm_photo LIKE ?', [`%${file}%`]);
    if (!rows.length) {
      console.log(`  - ${file}: tidak ada user yang cocok, lewati`);
      continue;
    }
    if (String(rows[0].ktm_photo || '').startsWith('data:image/')) {
      console.log(`  - ${file}: user ${rows[0].id} sudah base64, lewati`);
      continue;
    }
    const mime = MIME[path.extname(file).toLowerCase()] || 'image/jpeg';
    const buf = fs.readFileSync(path.join(KTM_DIR, file));
    const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
    await db.query('UPDATE users SET ktm_photo = ? WHERE id = ?', [dataUrl, rows[0].id]);
    console.log(`  + ${file} -> user id ${rows[0].id} (${(buf.length / 1024).toFixed(0)} KB)`);
    ok++;
  }

  const [sisa] = await db.query(
    "SELECT COUNT(*) AS n FROM users WHERE ktm_photo IS NOT NULL AND ktm_photo NOT LIKE 'data:image%'"
  );
  console.log(`[3/3] selesai: ${ok} foto dimigrasi. Sisa path lama di DB: ${sisa[0].n}`);
  process.exit(0);
})().catch((e) => {
  console.error('MIGRASI GAGAL:', e.message);
  console.error('Pastikan Laragon/MySQL menyala dan database sudah di-import.');
  process.exit(1);
});

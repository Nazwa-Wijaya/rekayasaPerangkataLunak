// Migrasi sekali jalan: tambah email akun + token reset password + kolom attempts.
require("dotenv").config();
const db = require("./config/db");

(async () => {
  try {
    await db.query("ALTER TABLE users ADD COLUMN email VARCHAR(254) NULL UNIQUE AFTER nim").catch((e) => {
      if (e.code !== "ER_DUP_FIELDNAME") throw e;
    });
    await db.query(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      token_hash CHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      attempts INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_reset_expiry (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    // Tambah kolom attempts jika tabel sudah ada sebelumnya tanpa kolom ini
    await db.query("ALTER TABLE password_reset_tokens ADD COLUMN attempts INT NOT NULL DEFAULT 0 AFTER used_at").catch((e) => {
      if (e.code !== "ER_DUP_FIELDNAME") throw e;
    });
    console.log("Migrasi password reset selesai.");
  } catch (e) {
    console.error("Migrasi password reset gagal:", e.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
})();

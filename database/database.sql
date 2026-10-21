-- ==========================================================
-- DATABASE: lost_and_found_kampus
-- Sistem Informasi Lost & Found Terintegrasi Kampus
-- Kompatibel dengan MySQL / MariaDB (Laragon / phpMyAdmin / HeidiSQL)
-- PRD §5: satu-satunya sumber struktur (file database.sql di root sudah dihapus).
-- Password WAJIB bcrypt hash di `password_hash`. Tidak ada plaintext.
-- Regist mahasiswa: verification_status PENDING -> ACTIVE/REJECTED (Cara B: KTM + ACC admin).
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `lost_and_found_kampus`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `lost_and_found_kampus`;

-- Matikan foreign key check saat migrasi struktur awal
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `returns`;
DROP TABLE IF EXISTS `matches`;
DROP TABLE IF EXISTS `found_items`;
DROP TABLE IF EXISTS `lost_reports`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- 1. TABEL USERS (Mahasiswa, Petugas, Admin)
-- PRD §4 + §5: password_hash (bcrypt), status verifikasi regist KTM
-- Daftar prodi valid ada di PRD §3 (ditegakkan di backend).
-- ==========================================================
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Nama lengkap pengguna',
  `nim` VARCHAR(30) NULL UNIQUE COMMENT 'Nomor Induk Mahasiswa (khusus role user, angka 5-15 digit)',
  `prodi` VARCHAR(100) NULL COMMENT 'Program studi (role user, dari daftar PRD §3) / divisi petugas',
  `username` VARCHAR(50) NULL UNIQUE COMMENT 'Username untuk login staf (petugas/admin)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt password. JANGAN simpan plaintext.',
  `role` ENUM('user', 'petugas', 'admin') NOT NULL DEFAULT 'user' COMMENT 'Hak akses akun',
  `verification_status` ENUM('PENDING', 'ACTIVE', 'REJECTED') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Status verifikasi regist KTM (Cara B). Staf selalu ACTIVE.',
  `ktm_photo` MEDIUMTEXT NULL COMMENT 'Foto KTM base64 data URL (hanya role user, disimpan langsung di database)',
  `rejected_reason` TEXT NULL COMMENT 'Alasan penolakan verifikasi regist oleh admin',
  `verified_by_id` INT NULL COMMENT 'ID admin yang ACC / menolak regist',
  `verified_at` DATETIME NULL COMMENT 'Waktu verifikasi regist oleh admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_verifier` FOREIGN KEY (`verified_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_role` (`role`),
  INDEX `idx_nim` (`nim`),
  INDEX `idx_verification` (`verification_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 2. TABEL CATEGORIES (Kategori Barang)
-- ==========================================================
CREATE TABLE `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Nama kategori barang',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 3. TABEL LOST_REPORTS (Laporan Barang Hilang oleh Mahasiswa)
-- Aturan: Aktif maksimal 3 hari setelah disetujui (ACTIVE)
-- Label admin: "Laporan Barang Hilang Masuk"
-- ==========================================================
CREATE TABLE `lost_reports` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'ID mahasiswa pelapor',
  `category_id` INT NOT NULL COMMENT 'ID kategori barang',
  `item_name` VARCHAR(150) NOT NULL COMMENT 'Nama barang hilang',
  `color` VARCHAR(50) NOT NULL COMMENT 'Warna barang',
  `brand` VARCHAR(100) NULL COMMENT 'Merk atau brand barang',
  `building` VARCHAR(50) NOT NULL COMMENT 'Gedung lokasi kehilangan (Gedung A / Gedung B)',
  `lost_location` VARCHAR(255) NOT NULL COMMENT 'Nama spesifik lokasi terakhir terlihat',
  `classroom_number` VARCHAR(10) NULL COMMENT 'Nomor ruang kelas jika di kelas',
  `lost_date` DATE NOT NULL COMMENT 'Perkiraan tanggal kehilangan',
  `description` TEXT NOT NULL COMMENT 'Ciri-ciri khusus rahasia / deskripsi barang',
  `photo` MEDIUMTEXT NULL COMMENT 'Foto barang (base64 atau path/URL)',
  `status` ENUM('PENDING', 'ACTIVE', 'FOUND', 'RETURNED', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING' COMMENT 'Status laporan kehilangan',
  `approved_at` DATETIME NULL COMMENT 'Waktu disetujui Admin (ACC)',
  `expired_at` DATETIME NULL COMMENT 'Masa aktif berakhir (approved_at + 3 hari)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lost_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lost_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  INDEX `idx_lost_status` (`status`),
  INDEX `idx_lost_date` (`lost_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 4. TABEL FOUND_ITEMS (Barang Temuan Diterima Petugas / Admin)
-- Aturan: Mahasiswa tidak bisa upload langsung, diserahkan ke Petugas/Admin
-- Label admin: "Laporan Barang Ditemukan Masuk"
-- ==========================================================
CREATE TABLE `found_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NOT NULL COMMENT 'ID kategori barang',
  `item_name` VARCHAR(150) NOT NULL COMMENT 'Nama barang temuan',
  `color` VARCHAR(50) NULL COMMENT 'Warna barang temuan',
  `brand` VARCHAR(100) NULL COMMENT 'Merk atau brand',
  `building` VARCHAR(50) NOT NULL COMMENT 'Gedung lokasi ditemukan',
  `found_location` VARCHAR(255) NOT NULL COMMENT 'Lokasi spesifik penemuan',
  `classroom_number` VARCHAR(10) NULL COMMENT 'Nomor ruang kelas jika ditemukan di kelas',
  `found_date` DATE NOT NULL COMMENT 'Tanggal ditemukan',
  `description` TEXT NULL COMMENT 'Kondisi barang dan catatan saat diterima',
  `photo` MEDIUMTEXT NULL COMMENT 'Foto barang temuan (base64 / path / URL)',
  `status` ENUM('PENDING_APPROVAL', 'APPROVED', 'MATCHED', 'RETURNED', 'REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL' COMMENT 'Status barang temuan',
  `received_by_id` INT NOT NULL COMMENT 'Petugas atau Admin yang mencatat penerimaan barang',
  `received_by_name` VARCHAR(100) NOT NULL COMMENT 'Nama pencatat (misal: Petugas - Budi Santoso)',
  `approved_by_id` INT NULL COMMENT 'Admin yang menyetujui (ACC)',
  `approved_at` DATETIME NULL COMMENT 'Waktu disetujui Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_found_cat` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_found_receiver` FOREIGN KEY (`received_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_found_approver` FOREIGN KEY (`approved_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_found_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 5. TABEL MATCHES (Pencocokan Antara Laporan Hilang & Barang Temuan)
-- ==========================================================
CREATE TABLE `matches` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lost_report_id` INT NOT NULL COMMENT 'ID laporan kehilangan',
  `found_item_id` INT NOT NULL COMMENT 'ID barang temuan yang cocok',
  `matched_by_id` INT NOT NULL COMMENT 'ID admin yang melakukan pencocokan',
  `matched_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pencocokan dilakukan',
  `notes` TEXT NULL COMMENT 'Catatan kecocokan',
  CONSTRAINT `fk_match_lost` FOREIGN KEY (`lost_report_id`) REFERENCES `lost_reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_match_found` FOREIGN KEY (`found_item_id`) REFERENCES `found_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_match_admin` FOREIGN KEY (`matched_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  INDEX `idx_match_lost` (`lost_report_id`),
  INDEX `idx_match_found` (`found_item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 6. TABEL RETURNS (Riwayat Verifikasi & Pengembalian Barang)
-- ==========================================================
CREATE TABLE `returns` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lost_report_id` INT NOT NULL COMMENT 'ID laporan kehilangan yang dikembalikan',
  `found_item_id` INT NULL COMMENT 'ID barang temuan yang diserahkan',
  `user_id` INT NOT NULL COMMENT 'ID mahasiswa pemilik barang',
  `verified_by_id` INT NOT NULL COMMENT 'ID admin yang memverifikasi dan menyerahkan',
  `returned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu resmi penyerahan',
  `check_1_details` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cek 1: Ciri khusus sesuai',
  `check_2_contents` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cek 2: Isi dalam barang sesuai',
  `check_3_proof` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cek 3: Bukti kepemilikan valid',
  `check_4_identity` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cek 4: Identitas mahasiswa sesuai NIM',
  `check_5_signed` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cek 5: Berita acara serah terima ditandatangani',
  `notes` TEXT NULL COMMENT 'Catatan berita acara penyerahan',
  `taker_name` VARCHAR(100) NULL COMMENT 'Nama pengambil barang',
  `taker_nim` VARCHAR(30) NULL COMMENT 'NIM pengambil barang',
  `taker_prodi` VARCHAR(80) NULL COMMENT 'Program studi pengambil',
  `taker_phone` VARCHAR(16) NULL COMMENT 'Nomor HP pengambil',
  `taker_photo` MEDIUMTEXT NULL COMMENT 'Foto KTM pengambil',
  `taker_receipt` MEDIUMTEXT NULL COMMENT 'Foto struk pembelian (opsional)',
  `taker_selfie` MEDIUMTEXT NULL COMMENT 'Foto diri pengambil',
  CONSTRAINT `fk_return_lost` FOREIGN KEY (`lost_report_id`) REFERENCES `lost_reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_return_found` FOREIGN KEY (`found_item_id`) REFERENCES `found_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_return_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_return_admin` FOREIGN KEY (`verified_by_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 7. TABEL MESSAGES (Fitur Chat Antara Mahasiswa & Admin)
-- ==========================================================
CREATE TABLE `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL COMMENT 'ID mahasiswa pemilik sesi percakapan',
  `sender_role` ENUM('user', 'admin') NOT NULL COMMENT 'Pihak pengirim pesan',
  `sender_id` INT NOT NULL COMMENT 'ID akun pengguna yang mengirim pesan',
  `report_id` INT NULL COMMENT 'ID laporan kehilangan yang sedang dibahas',
  `message` TEXT NOT NULL COMMENT 'Isi teks percakapan',
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Status dibaca oleh penerima',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_msg_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_report` FOREIGN KEY (`report_id`) REFERENCES `lost_reports` (`id`) ON DELETE SET NULL,
  INDEX `idx_msg_thread` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 8. TABEL AUDIT_LOGS (PRD §5: catat ACC regist, ACC laporan, match, return)
-- ==========================================================
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_id` INT NULL COMMENT 'ID akun pelaku aksi (NULL = sistem)',
  `action` VARCHAR(100) NOT NULL COMMENT 'Contoh: regist.pending, regist.approve, regist.reject, report.approve, found.approve, match.create, return.create',
  `target_type` VARCHAR(50) NULL COMMENT 'users | lost_reports | found_items | matches | returns',
  `target_id` INT NULL COMMENT 'ID baris target',
  `detail` TEXT NULL COMMENT 'Catatan tambahan (alasan tolak, dsb)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `idx_audit_action` (`action`),
  INDEX `idx_audit_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- DATA SEEDER AWAL
-- Password demo di-hash bcrypt (cost 10):
--   mahasiswa123, petugas123, admin123
-- Prodi user memakai daftar PRD §3.
-- ==========================================================

-- 1. Insert Kategori
INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Dompet dan tas'),
(2, 'Elektronik'),
(3, 'Dokumen dan kartu'),
(4, 'Kunci'),
(5, 'Pakaian dan aksesori'),
(6, 'Alat tulis dan buku'),
(7, 'Lainnya');

-- 2. Insert Pengguna (kolom password_hash, bukan password plaintext)
INSERT INTO `users` (`id`, `name`, `nim`, `prodi`, `username`, `password_hash`, `role`, `verification_status`) VALUES
(1, 'Rina Marlina', '2211001', 'S-1 Teknik Informatika', NULL, '$2b$10$wX9chlA.s2ZDv40s.MS9jeNXck6ko1yRxId8N7RqxwoEP.XXZ9KVe', 'user', 'ACTIVE'),
(2, 'Dimas Prakoso', '2211014', 'S-1 Teknik Industri', NULL, '$2b$10$wX9chlA.s2ZDv40s.MS9jeNXck6ko1yRxId8N7RqxwoEP.XXZ9KVe', 'user', 'ACTIVE'),
(3, 'Sari Lubis', '2311020', 'S-1 Manajemen', NULL, '$2b$10$wX9chlA.s2ZDv40s.MS9jeNXck6ko1yRxId8N7RqxwoEP.XXZ9KVe', 'user', 'ACTIVE'),
(4, 'Budi Santoso', NULL, 'Keamanan & Logistik', 'petugas', '$2b$10$yqVmSBakKgmxGmpoy6.Hm.NARyOlT7WlJk56NJMyGlXpDiVcO8X7C', 'petugas', 'ACTIVE'),
(5, 'Petugas Kemahasiswaan', NULL, 'Pusat Kemahasiswaan', 'admin', '$2b$10$tGsbKAQWPuIN3BTGrmyuPuvlpuzSCC69xhZ64PXWM/7K7mIzVd0C6', 'admin', 'ACTIVE'),
(6, 'Dewi Anggraini', '2412001', 'S-1 Sistem Informasi', NULL, '$2b$10$wX9chlA.s2ZDv40s.MS9jeNXck6ko1yRxId8N7RqxwoEP.XXZ9KVe', 'user', 'PENDING');

-- 3. Insert Laporan Kehilangan
INSERT INTO `lost_reports` (`id`, `user_id`, `category_id`, `item_name`, `color`, `brand`, `building`, `lost_location`, `classroom_number`, `lost_date`, `description`, `photo`, `status`, `approved_at`, `expired_at`, `created_at`) VALUES
(1, 1, 1, 'Dompet kulit hitam', 'Hitam', 'Eiger', 'Gedung A', 'Gedung A - Ruang kelas 305', '305', '2026-09-29', 'Berisi KTM, SIM, dan kartu ATM. Ada gantungan kunci kecil di resleting.', '', 'ACTIVE', '2026-09-30 08:00:00', '2026-10-03 08:00:00', '2026-09-29 10:15:00'),
(2, 3, 4, 'Kunci motor Honda', 'Perak', 'Honda', 'Gedung A', 'Gedung A - Parkiran belakang', NULL, '2026-09-28', 'Gantungan boneka beruang biru.', '', 'PENDING', NULL, NULL, '2026-09-28 14:20:00'),
(3, 2, 2, 'Earbuds putih', 'Putih', 'Xiaomi', 'Gedung B', 'Gedung B - Perpustakaan', NULL, '2026-09-27', 'Case ada stiker huruf D.', '', 'FOUND', '2026-09-28 09:00:00', '2026-10-01 09:00:00', '2026-09-27 16:30:00'),
(4, 1, 5, 'Jaket hoodie abu-abu', 'Abu-abu', 'Uniqlo', 'Gedung B', 'Gedung B - Aula', NULL, '2026-09-22', 'Ukuran M, ada noda tinta di lengan kiri.', '', 'EXPIRED', '2026-09-24 10:00:00', '2026-09-27 10:00:00', '2026-09-22 11:00:00'),
(5, 3, 6, 'Kalkulator ilmiah', 'Hitam', 'Casio', 'Gedung B', 'Gedung B - Ruang kelas 201', '201', '2026-09-25', 'Tertulis nama di bagian belakang.', '', 'RETURNED', '2026-09-26 13:00:00', '2026-09-29 13:00:00', '2026-09-25 09:00:00');

-- 4. Insert Barang Temuan
INSERT INTO `found_items` (`id`, `category_id`, `item_name`, `color`, `brand`, `building`, `found_location`, `classroom_number`, `found_date`, `description`, `photo`, `status`, `received_by_id`, `received_by_name`, `approved_by_id`, `approved_at`, `created_at`) VALUES
(101, 2, 'Earbuds putih dengan case', 'Putih', 'Xiaomi', 'Gedung B', 'Gedung B - Perpustakaan', NULL, '2026-09-28', 'Ditemukan di meja baca lantai 2 perpustakaan.', '', 'MATCHED', 4, 'Petugas - Budi Santoso', 5, '2026-09-28 11:00:00', '2026-09-28 10:30:00'),
(102, 1, 'Dompet lipat hitam', 'Hitam', 'Eiger', 'Gedung A', 'Gedung A - Ruang kelas 305', '305', '2026-09-30', 'Diserahkan mahasiswa penemu ke meja admin kemahasiswaan.', '', 'APPROVED', 5, 'Admin Kemahasiswaan', 5, '2026-09-30 08:30:00', '2026-09-30 08:30:00'),
(103, 7, 'Tumbler minum perak', 'Perak', 'Lock&Lock', 'Gedung A', 'Gedung A - Musholah lantai 1', NULL, '2026-09-29', 'Tertinggal di dekat tempat wudhu.', '', 'PENDING_APPROVAL', 4, 'Petugas - Budi Santoso', NULL, NULL, '2026-09-29 15:45:00');

-- 5. Insert Matches
INSERT INTO `matches` (`id`, `lost_report_id`, `found_item_id`, `matched_by_id`, `matched_at`, `notes`) VALUES
(1, 3, 101, 5, '2026-09-29 10:00:00', 'Kesesuaian merk Xiaomi dan stiker huruf D pada case');

-- 6. Insert Returns
INSERT INTO `returns` (`id`, `lost_report_id`, `found_item_id`, `user_id`, `verified_by_id`, `returned_at`, `check_1_details`, `check_2_contents`, `check_3_proof`, `check_4_identity`, `check_5_signed`, `notes`) VALUES
(1, 5, NULL, 3, 5, '2026-09-27 14:00:00', 1, 1, 1, 1, 1, 'Kalkulator diserahkan setelah mencocokkan tulisan nama di balik kalkulator.');

-- 7. Insert Messages
INSERT INTO `messages` (`id`, `user_id`, `sender_role`, `sender_id`, `report_id`, `message`, `is_read`, `created_at`) VALUES
(1, 2, 'admin', 5, 3, 'Halo Dimas, laporan Earbuds putih Anda telah cocok dengan temuan di Perpustakaan. Silakan datang ke kantor kemahasiswaan untuk verifikasi kepemilikan.', 1, '2026-09-29 10:05:00'),
(2, 2, 'user', 2, 3, 'Baik terima kasih Pak, siang ini saya akan ke Gedung A membawa struk pembelian dan dus Earbuds.', 1, '2026-09-30 09:12:00');

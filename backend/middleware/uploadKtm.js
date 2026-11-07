const multer = require("multer");

// KTM disimpan sebagai base64 di database (MEDIUMTEXT), bukan file di disk.
// Gunakan memoryStorage agar file tersedia sebagai buffer di req.file.buffer.

const KTM_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
// Frontend mengecilkan foto ke ~450 KB sebelum kirim. Batas server 2 MB hanya pengaman
// untuk request langsung ke API (base64 membesar ~33% dan harus muat di max_allowed_packet).
const KTM_MAX = 2 * 1024 * 1024; // 2 MB

const storage = multer.memoryStorage();

const uploadKtm = multer({
  storage,
  limits: { fileSize: KTM_MAX },
  fileFilter: (_req, file, cb) => {
    if (!KTM_MIME.has(file.mimetype)) {
      return cb(new Error("Foto KTM harus JPG, PNG, atau WEBP (maks 2 MB)."));
    }
    return cb(null, true);
  },
}).single("ktm");

/**
 * Konversi buffer file KTM menjadi base64 data URL.
 * @param {object} file - req.file dari multer memoryStorage
 * @returns {string} data URL (contoh: "data:image/jpeg;base64,...")
 */
function fileToBase64(file) {
  if (!file || !file.buffer) return "";
  const base64 = file.buffer.toString("base64");
  return `data:${file.mimetype};base64,${base64}`;
}

module.exports = { uploadKtm, fileToBase64 };

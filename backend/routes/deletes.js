// routes/deletes.js — Hapus per-item.
const express = require("express");
const db = require("../config/db");
const { sendErr } = require("../utils/sendErr");
const { audit } = require("../utils/audit");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 4c. HAPUS LAPORAN / TEMUAN (ganti reset global: hapus per-item + audit)
// ==========================================
router.delete(
  "/api/reports/:id",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      await db.query("DELETE FROM lost_reports WHERE id = ?", [req.params.id]);
      await audit(
        req.auth.id,
        "report.delete",
        "lost_reports",
        req.params.id,
        null,
      );
      res.json({ success: true, message: "Laporan kehilangan dihapus." });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
router.delete(
  "/api/found/:id",
  requireAuth,
  requireRole("admin", "petugas"),
  async (req, res) => {
    try {
      if (req.auth.role === "petugas") {
        const [rows] = await db.query(
          "SELECT received_by_id FROM found_items WHERE id = ?",
          [req.params.id],
        );
        if (!rows.length) return sendErr(res, 404, "Data tidak ditemukan.");
        if (rows[0].received_by_id !== req.auth.id)
          return sendErr(
            res,
            403,
            "Anda hanya boleh menghapus barang yang Anda terima.",
          );
      }
      await db.query("DELETE FROM found_items WHERE id = ?", [req.params.id]);
      await audit(
        req.auth.id,
        "found.delete",
        "found_items",
        req.params.id,
        null,
      );
      res.json({ success: true, message: "Barang temuan dihapus." });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = router;

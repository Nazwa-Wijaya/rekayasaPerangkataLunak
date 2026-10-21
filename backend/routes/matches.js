// routes/matches.js — Pencocokan.
const express = require("express");
const db = require("../config/db");
const { sendErr } = require("../utils/sendErr");
const { audit } = require("../utils/audit");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 4. MATCH + RETURN (admin, catat audit)
// ==========================================
router.get("/api/matches", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM matches ORDER BY matched_at DESC",
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post(
  "/api/matches",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { lost_report_id, found_item_id, notes } = req.body;
      if (!lost_report_id || !found_item_id)
        return sendErr(res, 400, "Pilih laporan hilang dan barang temuan.");
      const [r] = await db.query(
        "INSERT INTO matches (lost_report_id, found_item_id, matched_by_id, notes) VALUES (?, ?, ?, ?)",
        [lost_report_id, found_item_id, req.auth.id, notes || null],
      );
      await db.query("UPDATE lost_reports SET status = ? WHERE id = ?", [
        "FOUND",
        lost_report_id,
      ]);
      await db.query("UPDATE found_items SET status = ? WHERE id = ?", [
        "MATCHED",
        found_item_id,
      ]);
      await audit(
        req.auth.id,
        "match.create",
        "matches",
        r.insertId,
        notes || null,
      );
      res
        .status(201)
        .json({
          success: true,
          message: "Berhasil dicocokkan.",
          id: r.insertId,
        });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = router;

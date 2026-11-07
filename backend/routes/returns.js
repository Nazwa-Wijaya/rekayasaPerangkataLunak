// routes/returns.js — Pengembalian.
const express = require("express");
const db = require("../config/db");
const { sendErr } = require("../utils/sendErr");
const { audit } = require("../utils/audit");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 4e. RETURNS (lengkap: cek 5 poin + data pengambil, ganti mock)
// ==========================================
router.get("/api/returns", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { lost_report_id } = req.query;
    let q = "SELECT * FROM returns WHERE 1=1";
    const params = [];
    if (lost_report_id) {
      q += " AND lost_report_id = ?";
      params.push(lost_report_id);
    }
    q += " ORDER BY returned_at DESC";
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post(
  "/api/returns",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const {
        lost_report_id,
        found_item_id,
        user_id,
        notes,
        taker_name,
        taker_nim,
        taker_prodi,
        taker_phone,
        taker_photo,
        taker_receipt,
        taker_selfie,
        check_1_details,
        check_2_contents,
        check_3_proof,
        check_4_identity,
        check_5_signed,
      } = req.body;
      if (!lost_report_id || !user_id)
        return sendErr(res, 400, "Data pengembalian belum lengkap.");
      const [r] = await db.query(
        `INSERT INTO returns
      (lost_report_id, found_item_id, user_id, verified_by_id, notes,
       taker_name, taker_nim, taker_prodi, taker_phone, taker_photo, taker_receipt, taker_selfie,
       check_1_details, check_2_contents, check_3_proof, check_4_identity, check_5_signed)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lost_report_id,
          found_item_id || null,
          user_id,
          req.auth.id,
          notes || null,
          taker_name || null,
          taker_nim || null,
          taker_prodi || null,
          taker_phone || null,
          taker_photo || null,
          taker_receipt || null,
          taker_selfie || null,
          check_1_details !== false,
          check_2_contents !== false,
          check_3_proof !== false,
          check_4_identity !== false,
          check_5_signed !== false,
        ],
      );
      await db.query("UPDATE lost_reports SET status = ? WHERE id = ?", [
        "RETURNED",
        lost_report_id,
      ]);
      if (found_item_id)
        await db.query("UPDATE found_items SET status = ? WHERE id = ?", [
          "RETURNED",
          found_item_id,
        ]);
      await audit(
        req.auth.id,
        "return.create",
        "returns",
        r.insertId,
        notes || null,
      );
      res
        .status(201)
        .json({
          success: true,
          message: "Barang diserahkan (RETURNED).",
          id: r.insertId,
        });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = router;

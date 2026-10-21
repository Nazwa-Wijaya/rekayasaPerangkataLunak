// routes/reports.js — Laporan hilang.
const express = require("express");
const db = require("../config/db");
const { sendErr } = require("../utils/sendErr");
const { audit } = require("../utils/audit");
const { requireAuth, requireRole } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// ==========================================
// 2. ROUTE LAPORAN KEHILANGAN (LOST REPORTS)
// Label admin: "Laporan Barang Hilang Masuk"
// ==========================================
router.get("/api/reports", async (req, res) => {
  try {
    const { status, user_id } = req.query;
    let query = `
      SELECT r.*, c.name AS category_name, u.name AS user_name, u.nim, u.prodi
      FROM lost_reports r
      JOIN categories c ON r.category_id = c.id
      JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND r.status = ?";
      params.push(status);
    }
    if (user_id) {
      query += " AND r.user_id = ?";
      params.push(user_id);
    }

    query += " ORDER BY r.created_at DESC";

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Tambah laporan kehilangan baru (mahasiswa login)
router.post(
  "/api/reports",
  requireAuth,
  requireRole("user"),
  [
    body("category_id").isInt({ min: 1 }),
    body("item_name").trim().notEmpty(),
    body("color").trim().notEmpty(),
    body("building").isIn(["Gedung A", "Gedung B"]),
    body("lost_location").trim().notEmpty(),
    body("lost_date").isDate(),
    body("description").trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendErr(res, 400, "Data laporan belum lengkap / tidak valid.");

    try {
      const {
        category_id,
        item_name,
        color,
        brand,
        building,
        lost_location,
        classroom_number,
        lost_date,
        description,
        photo,
      } = req.body;

      const [result] = await db.query(
        `INSERT INTO lost_reports
        (user_id, category_id, item_name, color, brand, building, lost_location, classroom_number, lost_date, description, photo, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
        [
          req.auth.id,
          category_id,
          item_name,
          color,
          brand || "",
          building,
          lost_location,
          classroom_number || null,
          lost_date,
          description,
          photo || "",
        ],
      );

      res.status(201).json({
        success: true,
        message: "Laporan barang hilang diterima, menunggu verifikasi Admin.",
        id: result.insertId,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
// ACC / tolak laporan hilang (admin)
router.patch(
  "/api/reports/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { approve, reason } = req.body;
      const status = approve === false ? "REJECTED" : "ACTIVE";
      const now = new Date();
      const expired = new Date(now);
      expired.setDate(expired.getDate() + 3);
      await db.query(
        "UPDATE lost_reports SET status = ?, approved_at = ?, expired_at = ? WHERE id = ?",
        approve === false
          ? [status, null, null, req.params.id]
          : [status, now, expired, req.params.id],
      );
      await audit(
        req.auth.id,
        approve === false ? "report.reject" : "report.approve",
        "lost_reports",
        req.params.id,
        reason || null,
      );
      res.json({
        success: true,
        message:
          approve === false
            ? "Laporan barang hilang ditolak."
            : "Laporan barang hilang disetujui, aktif 3 hari di forum.",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = router;

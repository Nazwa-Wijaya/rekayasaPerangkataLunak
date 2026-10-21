// routes/found.js — Barang temuan.
const express = require("express");
const db = require("../config/db");
const { sendErr } = require("../utils/sendErr");
const { audit } = require("../utils/audit");
const { requireAuth, requireRole } = require("../middleware/auth");
const { body, validationResult } = require("express-validator");

const router = express.Router();

// ==========================================
// 3. ROUTE BARANG TEMUAN (FOUND ITEMS)
// Label admin: "Laporan Barang Ditemukan Masuk"
// ==========================================
router.get("/api/found", async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT f.*, c.name AS category_name
      FROM found_items f
      JOIN categories c ON f.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += " AND f.status = ?";
      params.push(status);
    }

    query += " ORDER BY f.created_at DESC";

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// Tambah barang temuan (petugas/admin login)
router.post(
  "/api/found",
  requireAuth,
  requireRole("petugas", "admin"),
  [
    body("category_id").isInt({ min: 1 }),
    body("item_name").trim().notEmpty(),
    body("building").isIn(["Gedung A", "Gedung B"]),
    body("found_location").trim().notEmpty(),
    body("found_date").isDate(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return sendErr(
        res,
        400,
        "Data barang temuan belum lengkap / tidak valid.",
      );
    try {
      const {
        category_id,
        item_name,
        color,
        brand,
        building,
        found_location,
        classroom_number,
        found_date,
        description,
        photo,
      } = req.body;

      const isAdmin = req.auth.role === "admin";
      const status = isAdmin ? "APPROVED" : "PENDING_APPROVAL";

      const [me] = await db.query("SELECT name FROM users WHERE id = ?", [
        req.auth.id,
      ]);
      const myName = (me[0] && me[0].name) || "Staf";

      const [result] = await db.query(
        `INSERT INTO found_items
        (category_id, item_name, color, brand, building, found_location, classroom_number, found_date, description, photo, status, received_by_id, received_by_name, approved_by_id, approved_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category_id,
          item_name,
          color || "",
          brand || "",
          building,
          found_location,
          classroom_number || null,
          found_date,
          description || "",
          photo || "",
          status,
          req.auth.id,
          isAdmin ? "Admin Kemahasiswaan" : `Petugas - ${myName}`,
          isAdmin ? req.auth.id : null,
          isAdmin ? new Date() : null,
        ],
      );

      res.status(201).json({
        success: true,
        message: isAdmin
          ? "Barang temuan dicatat (APPROVED)."
          : "Barang temuan dicatat, menunggu ACC Admin.",
        id: result.insertId,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);
// ACC / tolak barang temuan (admin)
router.patch(
  "/api/found/:id/approve",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { approve } = req.body;
      if (approve === false) {
        await db.query("UPDATE found_items SET status = ? WHERE id = ?", [
          "REJECTED",
          req.params.id,
        ]);
        await audit(
          req.auth.id,
          "found.reject",
          "found_items",
          req.params.id,
          null,
        );
        return res.json({
          success: true,
          message: "Laporan barang ditemukan ditolak.",
        });
      }
      await db.query(
        "UPDATE found_items SET status = ?, approved_by_id = ?, approved_at = ? WHERE id = ?",
        ["APPROVED", req.auth.id, new Date(), req.params.id],
      );
      await audit(
        req.auth.id,
        "found.approve",
        "found_items",
        req.params.id,
        null,
      );
      res.json({
        success: true,
        message: "Laporan barang ditemukan disetujui (ACC).",
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
);

module.exports = router;

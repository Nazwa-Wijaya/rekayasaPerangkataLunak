// routes/categories.js — GET /api/categories.
const express = require("express");
const db = require("../config/db");

const router = express.Router();

// ==========================================
// 1. ROUTE KATEGORI
// ==========================================
router.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories ORDER BY id ASC");
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// routes/prodi.js — GET /api/prodi.
const express = require("express");
const { PRODI_LIST } = require("../config/prodi");

const router = express.Router();

// ==========================================
// 0. DAFTAR PRODI (PRD §3, dipakai dropdown frontend)
// ==========================================
router.get("/api/prodi", (_req, res) => {
  res.json({ success: true, data: PRODI_LIST });
});

module.exports = router;

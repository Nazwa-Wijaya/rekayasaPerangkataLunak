// routes/users.js — GET /api/users.
const express = require("express");
const db = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// ==========================================
// 4b. USERS (admin: daftar mahasiswa/petugas untuk Data Master + chat)
// ==========================================
router.get("/api/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { role, status } = req.query;
    let q =
      "SELECT id, name, nim, prodi, username, role, verification_status, ktm_photo, rejected_reason, created_at FROM users WHERE 1=1";
    const params = [];
    if (role) {
      q += " AND role = ?";
      params.push(role);
    }
    if (status) {
      q += " AND verification_status = ?";
      params.push(status);
    }
    q += " ORDER BY created_at ASC";
    const [rows] = await db.query(q, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

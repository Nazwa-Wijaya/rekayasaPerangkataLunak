// utils/audit.js — Audit log.
const db = require("../config/db");

const audit = async (actorId, action, targetType, targetId, detail) => {
  try {
    await db.query(
      "INSERT INTO audit_logs (actor_id, action, target_type, target_id, detail) VALUES (?, ?, ?, ?, ?)",
      [
        actorId || null,
        action,
        targetType || null,
        targetId || null,
        detail || null,
      ],
    );
  } catch (e) {
    console.warn("audit gagal:", e.message);
  }
};

module.exports = { audit };

// utils/sendErr.js — Respons error JSON.
const sendErr = (res, code, message) =>
  res.status(code).json({ success: false, message });

module.exports = { sendErr };

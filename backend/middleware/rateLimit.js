// middleware/rateLimit.js — Rate-limit login+register.
const rateLimit = require("express-rate-limit");

// Rate-limit login + register (PRD §8)
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'lost-found-dev-secret-GANTI-DI-PRODUKSI';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '12h';

const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, nim: user.nim || null, username: user.username || null },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );

// Wajib login (JWT di header Authorization: Bearer <token>,
// atau query ?token=... khusus untuk <img>/<a target=_blank> yang tidak bisa set header)
function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || '';
  let token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token && req.query && req.query.token) token = String(req.query.token);
  if (!token) return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan masuk.' });
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Sesi kedaluwarsa. Silakan masuk ulang.' });
  }
}

// Batasi peran, contoh: requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, message: 'Anda tidak memiliki izin untuk aksi ini.' });
    }
    return next();
  };
}

module.exports = { signToken, requireAuth, requireRole };

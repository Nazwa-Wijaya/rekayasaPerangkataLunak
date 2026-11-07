// utils/publicUser.js — Buang password_hash.
const publicUser = (u) => {
  if (!u) return u;
  const { password_hash, password, ...rest } = u; // jangan pernah kirim hash
  return rest;
};

module.exports = { publicUser };

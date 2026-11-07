require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
const [rows] = await conn.query("SELECT username, password_hash FROM users WHERE username = 'admin'");
console.log(rows.length ? bcrypt.compareSync('superadmin123', rows[0].password_hash) : 'user admin tidak ketemu');
  await conn.end();
})();
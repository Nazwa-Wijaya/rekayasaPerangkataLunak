const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi koneksi ke MySQL Laragon
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lost_and_found_kampus',
  ssl: { rejectUnauthorized: false },
  connectionLimit: 5,
  waitForConnections: true,
  queueLimit: 0,
});

// Uji koneksi awal
pool.getConnection()
  .then((conn) => {
    console.log('DB dipakai:', process.env.DB_HOST, process.env.DB_NAME);
    conn.release();
  })
  .catch((err) => {
    console.error('✗ Gagal koneksi ke database Laragon:', err.message);
    console.error('  Pastikan Laragon sudah di-Start dan database sudah di-import.');
  });

module.exports = pool;

const mysql = require('mysql2/promise');
require('dotenv').config();

// Konfigurasi koneksi ke MySQL (Support Laragon Lokal & Aiven Cloud dengan SSL)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lost_and_found_kampus',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Jika host mengarah ke Aiven (aivencloud.com), aktifkan SSL
if (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com')) {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

// Uji koneksi awal
pool.getConnection()
  .then((conn) => {
    console.log(`✓ Terhubung ke database MySQL (${dbConfig.host}:${dbConfig.port} / ${dbConfig.database})`);
    conn.release();
  })
  .catch((err) => {
    console.error('✗ Gagal koneksi ke database:', err.message);
  });

module.exports = pool;

const { Pool } = require('pg');
const env = require('../config/env');

/**
 * Satu connection pool dipakai bersama oleh seluruh aplikasi.
 * Membuat koneksi baru per request jauh lebih lambat dan bisa menghabiskan
 * batas koneksi PostgreSQL.
 */
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
});

module.exports = pool;

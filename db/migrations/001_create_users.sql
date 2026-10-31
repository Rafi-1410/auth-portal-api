-- Tabel users.
-- Email disimpan dalam huruf kecil (dinormalisasi di layer aplikasi) dan dijaga
-- unik oleh constraint database, bukan hanya oleh pengecekan di kode, supaya
-- aman dari race condition saat dua registrasi dengan email sama masuk bersamaan.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  gender        VARCHAR(10)  NOT NULL CHECK (gender IN ('male', 'female')),
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

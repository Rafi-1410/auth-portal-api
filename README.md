# Auth Portal API

REST API portal autentikasi: siapa pun bisa membuat akun, login, lalu mengakses profilnya dengan JWT.
Dibuat untuk Knowledge Test Software Engineer PT Widya Informasi Nusantara.

**Stack:** Node.js 20+, Express 5, PostgreSQL, JWT (`jsonwebtoken`), bcrypt, Zod, Jest + Supertest, Swagger UI.

## Menjalankan di Local

### Opsi A: Docker (paling cepat)

```bash
docker compose up --build
```

API berjalan di `http://localhost:3000`, dokumentasi di `http://localhost:3000/docs`. Migrasi database dijalankan otomatis.

### Opsi B: Manual

Prasyarat: Node.js 20+ dan PostgreSQL yang sudah berjalan.

```bash
npm install
cp .env.example .env          # lalu sesuaikan DATABASE_URL dan JWT_SECRET
createdb auth_portal          # atau buat database lewat pgAdmin/psql
npm run migrate               # membuat tabel users
npm run dev                   # atau: npm start
```

### Menjalankan Test

```bash
npm test
```

Test tidak membutuhkan database karena memakai repository in-memory (lihat bagian Arsitektur).

### Kualitas Kode

```bash
npm run lint           # ESLint
npm run format:check   # Prettier
```

## Endpoint

Base URL: `/api/v1`. Dokumentasi interaktif (OpenAPI/Swagger) tersedia di **`/docs`**.

| Method | Path             | Auth   | Keterangan                            |
| ------ | ---------------- | ------ | ------------------------------------- |
| POST   | `/auth/register` | -      | Membuat akun, langsung mendapat token |
| POST   | `/auth/login`    | -      | Login, mendapat token                 |
| GET    | `/users/me`      | Bearer | Profil user yang sedang login         |
| GET    | `/health`        | -      | Health check (di luar `/api/v1`)      |

### Contoh

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Budi Santoso","email":"budi@example.com","gender":"male","password":"rahasia123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"budi@example.com","password":"rahasia123"}'

# Profil (ganti <TOKEN> dengan accessToken dari login)
curl http://localhost:3000/api/v1/users/me -H "Authorization: Bearer <TOKEN>"
```

### Format Response

Sukses:

```json
{ "success": true, "data": { "...": "..." } }
```

Error (format sama di seluruh endpoint):

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "email", "message": "email is not valid" }]
  }
}
```

| Status | Code                    | Kapan                                                  |
| ------ | ----------------------- | ------------------------------------------------------ |
| 400    | `VALIDATION_ERROR`      | Input tidak valid atau JSON rusak                      |
| 401    | `UNAUTHORIZED`          | Kredensial salah, token tidak ada/invalid/expired      |
| 404    | `NOT_FOUND`             | Route tidak ada, atau user pemilik token sudah dihapus |
| 409    | `CONFLICT`              | Email sudah terdaftar                                  |
| 429    | -                       | Terlalu banyak percobaan register/login                |
| 500    | `INTERNAL_SERVER_ERROR` | Error tak terduga (detail hanya di log server)         |

## Arsitektur

```
src/
├── config/env.js            # Validasi env var saat startup (fail fast)
├── db/                      # Connection pool + migration runner
├── middlewares/             # authenticate (JWT), validate (Zod), errorHandler
├── modules/
│   ├── auth/                # schema -> routes -> service
│   └── users/               # routes -> service -> repository (+ presenter)
├── utils/                   # AppError, token (JWT), password (bcrypt)
├── docs/openapi.yaml        # Dokumentasi API
├── app.js                   # Composition root: merakit dependency
└── server.js                # Entry point: koneksi DB nyata + listen
```

Aliran request: **Route** (validasi input, kirim response) → **Service** (business logic, tanpa tahu HTTP) → **Repository** (satu-satunya yang tahu SQL).

Keputusan desain utama:

- **Modular per fitur** (`auth`, `users`), bukan per jenis file. Menambah fitur baru cukup menambah folder baru.
- **Dependency injection** lewat factory function (`createAuthService({ userRepository, ... })`). `app.js` menerima dependency dari luar, sehingga produksi memakai repository PostgreSQL dan test memakai repository in-memory tanpa mengubah kode aplikasi.
- **Error handling terpusat.** Error yang diharapkan dilempar sebagai `AppError`; satu middleware membentuk semua response error. Express 5 meneruskan error dari async handler otomatis, jadi tidak ada `try/catch` berulang di route.
- **Presenter/whitelist** (`toPublicUser`) memastikan `password_hash` tidak pernah ikut terkirim ke client.

## Keamanan

- Password di-hash dengan **bcrypt** (salt per user, cost 12). Password asli tidak pernah disimpan atau dicatat di log.
- JWT ditandatangani HS256, **algoritma dikunci saat verifikasi** (token `alg: none` ditolak), punya masa berlaku, dan payload hanya berisi `sub` (id user).
- Login memakai **pesan error yang sama** untuk email tidak terdaftar dan password salah, dan tetap menjalankan bcrypt saat email tidak ditemukan, sehingga email terdaftar tidak bisa ditebak lewat pesan maupun waktu respons.
- **Keunikan email dijaga UNIQUE constraint database**, bukan pengecekan "cari dulu lalu insert", sehingga aman dari race condition.
- Query SQL selalu **parameterized** (anti SQL injection).
- **Rate limiting** di endpoint register/login, `helmet` untuk header keamanan, batas ukuran body 10 KB.
- Konfigurasi divalidasi saat startup, misalnya `JWT_SECRET` wajib minimal 32 karakter.

## Asumsi

1. **Password ditambahkan** sebagai field wajib saat registrasi. Soal hanya menyebut nama, email, dan jenis kelamin, tetapi login tanpa kredensial rahasia tidak aman.
2. **Login memakai email + password.** Email unik dan tidak membedakan huruf besar/kecil (`Budi@Mail.com` = `budi@mail.com`).
3. **Jenis kelamin** bernilai `male` atau `female`. Nilai disimpan dalam bahasa Inggris agar konsisten dengan nama field API; mudah diperluas lewat schema dan constraint DB.
4. **Register langsung mengembalikan token**, agar client tidak perlu memanggil login lagi.
5. Profil diakses lewat **`/users/me`** (berdasarkan token), bukan `/users/:id`, sehingga user tidak bisa mencoba membaca profil orang lain.
6. **Tanpa refresh token / logout di server.** JWT bersifat stateless dan berlaku sampai kedaluwarsa (default 1 jam). Lihat pengembangan lanjutan.

## Pengembangan Lanjutan

Hal yang sengaja tidak dikerjakan agar tetap fokus pada kebutuhan, tetapi akan ditambahkan di sistem produksi:

- Refresh token + rotasi, dan logout/revoke token (misalnya denylist di Redis).
- Verifikasi email dan reset password.
- Logging terstruktur (pino) dengan request ID.
- Integration test terhadap PostgreSQL sungguhan (misalnya Testcontainers) di CI.
- Endpoint update profil (`PATCH /users/me`).

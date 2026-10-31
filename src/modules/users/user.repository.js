/**
 * Repository = satu-satunya layer yang tahu SQL.
 * Service tidak peduli datanya dari PostgreSQL atau tempat lain, sehingga
 * repository ini bisa diganti implementasi in-memory saat testing.
 *
 * Semua query memakai parameter ($1, $2, ...) untuk mencegah SQL injection.
 */
const USER_COLUMNS = 'id, name, email, gender, created_at, updated_at';

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    gender: row.gender,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createUserRepository(db) {
  return {
    async create({ name, email, gender, passwordHash }) {
      const { rows } = await db.query(
        `INSERT INTO users (name, email, gender, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING ${USER_COLUMNS}`,
        [name, email, gender, passwordHash],
      );
      return toUser(rows[0]);
    },

    /** Dipakai saat login, karena butuh password_hash untuk dibandingkan. */
    async findByEmailWithPassword(email) {
      const { rows } = await db.query(
        `SELECT ${USER_COLUMNS}, password_hash FROM users WHERE email = $1`,
        [email],
      );
      return toUser(rows[0]);
    },

    async findById(id) {
      const { rows } = await db.query(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
      return toUser(rows[0]);
    },
  };
}

/** Kode error PostgreSQL untuk pelanggaran UNIQUE constraint. */
const UNIQUE_VIOLATION = '23505';

module.exports = { createUserRepository, UNIQUE_VIOLATION };

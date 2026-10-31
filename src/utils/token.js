const jwt = require('jsonwebtoken');

/**
 * Pembungkus JWT. Algoritma dikunci ke HS256 saat verify untuk mencegah
 * serangan "alg confusion" (misal token dengan alg "none").
 * Payload hanya berisi id user (sub), tanpa data sensitif, karena isi JWT
 * hanya di-encode base64, bukan dienkripsi.
 */
function createTokenService({ secret, expiresIn }) {
  const ALGORITHM = 'HS256';

  return {
    sign(userId) {
      return jwt.sign({}, secret, { subject: String(userId), expiresIn, algorithm: ALGORITHM });
    },

    /** Mengembalikan payload jika valid, melempar error jika tidak valid/kedaluwarsa. */
    verify(token) {
      return jwt.verify(token, secret, { algorithms: [ALGORITHM] });
    },

    expiresIn,
  };
}

module.exports = { createTokenService };

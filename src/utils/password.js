const bcrypt = require('bcryptjs');

/**
 * Password tidak pernah disimpan dalam bentuk asli. bcrypt otomatis menambahkan
 * salt unik per password dan sengaja lambat, sehingga brute force mahal.
 */
function createPasswordHasher({ saltRounds }) {
  return {
    hash: (plain) => bcrypt.hash(plain, saltRounds),
    compare: (plain, hash) => bcrypt.compare(plain, hash),
  };
}

module.exports = { createPasswordHasher };

/**
 * Menentukan field user apa saja yang boleh keluar ke client.
 * Dengan whitelist eksplisit, password_hash tidak mungkin ikut terkirim
 * walaupun suatu saat kolom baru ditambahkan ke tabel.
 */
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    gender: user.gender,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

module.exports = { toPublicUser };

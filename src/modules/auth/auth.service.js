const AppError = require('../../utils/AppError');
const { UNIQUE_VIOLATION } = require('../users/user.repository');
const { toPublicUser } = require('../users/user.presenter');

function createAuthService({ userRepository, passwordHasher, tokenService }) {
  function buildAuthResult(user) {
    return {
      user: toPublicUser(user),
      accessToken: tokenService.sign(user.id),
      tokenType: 'Bearer',
      expiresIn: tokenService.expiresIn,
    };
  }

  return {
    async register({ name, email, gender, password }) {
      const passwordHash = await passwordHasher.hash(password);
      try {
        const user = await userRepository.create({ name, email, gender, passwordHash });
        // Langsung kembalikan token supaya client tidak perlu login ulang setelah daftar.
        return buildAuthResult(user);
      } catch (err) {
        // Mengandalkan UNIQUE constraint database, bukan "cek dulu baru insert",
        // agar aman dari race condition.
        if (err.code === UNIQUE_VIOLATION) throw AppError.conflict('Email is already registered');
        throw err;
      }
    },

    async login({ email, password }) {
      const user = await userRepository.findByEmailWithPassword(email);

      // Tetap menjalankan bcrypt walau email tidak ditemukan, supaya waktu respons
      // sama dan email terdaftar tidak bisa ditebak dari lamanya respons (timing attack).
      if (!user) {
        await passwordHasher.hash(password);
        throw AppError.unauthorized('Invalid email or password');
      }

      const isValid = await passwordHasher.compare(password, user.passwordHash);

      // Pesan yang sama untuk "email tidak ada" dan "password salah" agar
      // penyerang tidak bisa menebak email mana yang terdaftar (user enumeration).
      if (!isValid) throw AppError.unauthorized('Invalid email or password');

      return buildAuthResult(user);
    },
  };
}

module.exports = { createAuthService };

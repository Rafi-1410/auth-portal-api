const AppError = require('../../utils/AppError');
const { toPublicUser } = require('./user.presenter');

function createUserService({ userRepository }) {
  return {
    async getProfile(userId) {
      const user = await userRepository.findById(userId);
      // Token valid tapi user sudah tidak ada (misal dihapus): perlakukan sebagai 404.
      if (!user) throw AppError.notFound('User not found');
      return toPublicUser(user);
    },
  };
}

module.exports = { createUserService };

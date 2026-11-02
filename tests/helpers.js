const { randomUUID } = require('node:crypto');
const { createApp } = require('../src/app');
const { createPasswordHasher } = require('../src/utils/password');
const { createTokenService } = require('../src/utils/token');
const { UNIQUE_VIOLATION } = require('../src/modules/users/user.repository');


function createInMemoryUserRepository() {
  const users = new Map();

  return {
    async create({ name, email, gender, passwordHash }) {
      if ([...users.values()].some((u) => u.email === email)) {
        const err = new Error('duplicate key');
        err.code = UNIQUE_VIOLATION;
        throw err;
      }
      const now = new Date();
      const user = {
        id: randomUUID(),
        name,
        email,
        gender,
        passwordHash,
        createdAt: now,
        updatedAt: now,
      };
      users.set(user.id, user);
      return user;
    },
    async findByEmailWithPassword(email) {
      return [...users.values()].find((u) => u.email === email) || null;
    },
    async findById(id) {
      return users.get(id) || null;
    },
    _users: users,
  };
}

const TEST_SECRET = 'test-secret-that-is-at-least-32-characters-long';

function buildTestApp() {
  const userRepository = createInMemoryUserRepository();
  const tokenService = createTokenService({ secret: TEST_SECRET, expiresIn: '1h' });
  const app = createApp({
    userRepository,
    passwordHasher: createPasswordHasher({ saltRounds: 4 }), // cepat untuk test
    tokenService,
    enableRateLimit: false,
  });
  return { app, userRepository, tokenService };
}

module.exports = { buildTestApp, TEST_SECRET };

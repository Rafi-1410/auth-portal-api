const env = require('./config/env');
const pool = require('./db/pool');
const { createApp } = require('./app');
const { createUserRepository } = require('./modules/users/user.repository');
const { createPasswordHasher } = require('./utils/password');
const { createTokenService } = require('./utils/token');

const app = createApp({
  userRepository: createUserRepository(pool),
  passwordHasher: createPasswordHasher({ saltRounds: env.BCRYPT_SALT_ROUNDS }),
  tokenService: createTokenService({ secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN }),
});

app.set('trust proxy', 1);

const server = app.listen(env.PORT, () => {
  console.log(`Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  console.log(`API docs at http://localhost:${env.PORT}/docs`);
});


function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(() => pool.end().then(() => process.exit(0)));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

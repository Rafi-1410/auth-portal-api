const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');

const authenticateMiddleware = require('./middlewares/authenticate');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { createAuthService } = require('./modules/auth/auth.service');
const { createAuthRouter } = require('./modules/auth/auth.routes');
const { createUserService } = require('./modules/users/user.service');
const { createUserRouter } = require('./modules/users/user.routes');

const openApiDoc = YAML.parse(
  fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'),
);

function createApp({ userRepository, passwordHasher, tokenService, enableRateLimit = true }) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10kb' }));

  
  const rateLimiter = enableRateLimit
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
      })
    : (_req, _res, next) => next();

  const authService = createAuthService({ userRepository, passwordHasher, tokenService });
  const userService = createUserService({ userRepository });
  const authenticate = authenticateMiddleware(tokenService);

  
  app.get('/', (_req, res) => res.redirect('/docs'));
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDoc));

  app.use('/api/v1/auth', createAuthRouter({ authService, rateLimiter }));
  app.use('/api/v1/users', createUserRouter({ userService, authenticate }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

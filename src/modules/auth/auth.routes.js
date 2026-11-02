const { Router } = require('express');
const validate = require('../../middlewares/validate');
const { registerSchema, loginSchema } = require('./auth.schema');


function createAuthRouter({ authService, rateLimiter }) {
  const router = Router();

  router.post('/register', rateLimiter, validate(registerSchema), async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  });

  router.post('/login', rateLimiter, validate(loginSchema), async (req, res) => {
    const result = await authService.login(req.body);
    res.status(200).json({ success: true, data: result });
  });

  return router;
}

module.exports = { createAuthRouter };

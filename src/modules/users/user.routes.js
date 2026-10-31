const { Router } = require('express');

/**
 * GET /users/me  -> profil user yang sedang login (dari token).
 * Memakai "/me" alih-alih "/users/:id" supaya user tidak bisa mencoba
 * mengakses profil orang lain dengan mengganti id di URL.
 */
function createUserRouter({ userService, authenticate }) {
  const router = Router();

  router.get('/me', authenticate, async (req, res) => {
    const profile = await userService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  });

  return router;
}

module.exports = { createUserRouter };

const AppError = require('../utils/AppError');

/**
 * Memastikan request membawa header "Authorization: Bearer <token>" yang valid.
 * Jika valid, id user disimpan di req.user agar bisa dipakai controller.
 * Pesan error dibuat umum supaya tidak memberi petunjuk ke penyerang.
 */
function authenticate(tokenService) {
  return (req, _res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return next(AppError.unauthorized('Missing or malformed Authorization header'));
    }

    try {
      const payload = tokenService.verify(token);
      req.user = { id: payload.sub };
      return next();
    } catch (err) {
      const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token';
      return next(AppError.unauthorized(message));
    }
  };
}

module.exports = authenticate;

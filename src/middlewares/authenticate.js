const AppError = require('../utils/AppError');


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

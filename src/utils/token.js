const jwt = require('jsonwebtoken');


function createTokenService({ secret, expiresIn }) {
  const ALGORITHM = 'HS256';

  return {
    sign(userId) {
      return jwt.sign({}, secret, { subject: String(userId), expiresIn, algorithm: ALGORITHM });
    },

    verify(token) {
      return jwt.verify(token, secret, { algorithms: [ALGORITHM] });
    },

    expiresIn,
  };
}

module.exports = { createTokenService };

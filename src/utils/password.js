const bcrypt = require('bcryptjs');


function createPasswordHasher({ saltRounds }) {
  return {
    hash: (plain) => bcrypt.hash(plain, saltRounds),
    compare: (plain, hash) => bcrypt.compare(plain, hash),
  };
}

module.exports = { createPasswordHasher };

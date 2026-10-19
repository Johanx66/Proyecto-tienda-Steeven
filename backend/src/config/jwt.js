require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};

const { Router } = require('express');
const { register, login } = require('../controllers/authController');
const { registerRules, loginRules, handleValidation } = require('../middleware/validation');

const router = Router();

router.post('/register', registerRules, handleValidation, register);
router.post('/login', loginRules, handleValidation, login);

module.exports = router;

const { Router } = require('express');
const { register, login, adminLogin } = require('../controllers/authController');
const { registerRules, loginRules, handleValidation } = require('../middleware/validation');

const router = Router();

router.post('/register', registerRules, handleValidation, register);
router.post('/login', loginRules, handleValidation, login);
router.post('/admin/login', loginRules, handleValidation, adminLogin);

module.exports = router;

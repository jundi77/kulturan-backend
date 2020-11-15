const express = require('express');
const RegisterController = require('../controllers/auth/RegisterController');
const LoginController = require('../controllers/auth/LoginController');
const TestTokenController = require('../controllers/auth/TestTokenController');
let router;

// api url
router = express.Router();
router.post('/test/register', RegisterController);
router.post('/test/login', LoginController);
router.post('/verif-token', TestTokenController);

module.exports = router;

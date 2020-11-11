const express = require('express');
const RegisterController = require('../controllers/auth/RegisterController');
const LoginController = require('../controllers/auth/LoginController');
let router;

// api url
router = express.Router();
router.post('/register', RegisterController);
router.post('/login', LoginController);

module.exports = router;

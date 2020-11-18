const express = require('express');
const RegisterController = require('../controllers/auth/RegisterController');
const LoginController = require('../controllers/auth/LoginController');
const TestTokenController = require('../controllers/auth/TestTokenController');
let router;

// api url
router = express.Router();
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            endpoint: {
                post: ['/test/register', '/test/login', '/verif-token'],
            },
        },
    });
});
router.post('/test/register', RegisterController);
router.post('/test/login', LoginController);
router.put('/test/user/edit', LoginController);
router.post('/test/user/keranjang');
router.delete('/test/user/keranjang');
router.post('/test/user/favorit');
router.delete('/test/user/favorit');
router.post('/test/user/buy');
router.post('/test/midtrans/payment-notif'); // buat midtrans
router.post('/test/video', LoginController);
router.post('/test/');
router.post('/verif-token', TestTokenController);
module.exports = router;

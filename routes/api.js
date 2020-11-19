const express = require('express');
const RegisterController = require('../controllers/auth/RegisterController');
const LoginController = require('../controllers/auth/LoginController');
const AuthTokenMiddleware = require('../middlewares/AuthTokenMiddleware');
const UserDataController = require('../controllers/UserDataController');
const VideoController = require('../controllers/VideoController');
const PaymentController = require('../controllers/PaymentController');

let router = express.Router();
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            string: 'hellow',
        },
    });
});

/**
 * Routing untuk user
 * @param app
 */
function userRoute(app) {
    let router = express.Router();

    router.put('/edit-account', UserDataController.editAccount);
    router.post('/keranjang', UserDataController.getKeranjang);
    router.put('/keranjang', UserDataController.addToKeranjang);
    router.delete('/keranjang', UserDataController.removeFromKeranjang);
    router.post('/favorit', UserDataController.getFavorit);
    router.put('/favorit', UserDataController.addToFavorit);
    router.delete('/favorit', UserDataController.removeFromFavorit);

    app.use('/user', router);
}

/**
 * Routing untuk video
 * @param app
 */
function videoRoute(app) {
    let router = express.Router();

    router.get('/', VideoController.getAll);
    router.get('/:videoid', VideoController.getFromID); // ambil hal dasar
    router.post('/:videoid', VideoController.getPremiumLink); // harus sudah beli, ini berarti minta link non trailer

    app.use('/video', router);
}

/**
 * Routing untuk payment
 * @param app
 */
function paymentGatewayRoute(app) {
    let router = express.Router();

    router.post('/buy', PaymentController.buy); // mau beli?
    router.put('/payment-struct', PaymentController.struct);
    router.post('/midtrans-receiver', PaymentController.midtransReceiver); // ambil notifikasi dari midtrans

    app.use('/payment', router);
}

// Authenticator
function authRoute(app) {
    let router = express.Router();

    router.post('/register', RegisterController);
    router.post('/login', LoginController);
    router.post('/verif-token', AuthTokenMiddleware({ sendUserData: true }));

    app.use('/auth', router);
}

module.exports = {
    userRoute,
    videoRoute,
    paymentGatewayRoute,
    authRoute,
};

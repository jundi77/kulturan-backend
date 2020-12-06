const express = require('express');
const RegisterController = require('../controllers/auth/RegisterController');
const LoginController = require('../controllers/auth/LoginController');
const AuthTokenMiddleware = require('../middlewares/AuthTokenMiddleware');
const MidtransOriginMiddleware = require('../middlewares/MidtransOriginMiddleware');
const MidtransVerifyNotificationMiddleware = require('../middlewares/MidtransVerifyNotificationMiddleware');
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
const userRoute = (app) => {
    let router = express.Router();

    router.use('/', AuthTokenMiddleware());
    router.put('/edit-account', UserDataController.editAccount);
    router.get('/keranjang', UserDataController.getKeranjang);
    router.put('/keranjang', UserDataController.addToKeranjang);
    router.put('/keranjang/delete', UserDataController.removeFromKeranjang);
    router.get('/favorit', UserDataController.getFavorit);
    router.put('/favorit', UserDataController.addToFavorit);
    router.put('/favorit/delete', UserDataController.removeFromFavorit);

    app.use('/user', router);
};

/**
 * Routing untuk video
 * @param app
 */
function videoRoute(app) {
    let router = express.Router();

    router.get('/', VideoController.getAll);
    router.get(
        '/:videoid',
        AuthTokenMiddleware({ nextWhenNoToken: true }),
        VideoController.getFromID
    );

    app.use('/video', router);
}

/**
 * Routing untuk payment
 * @param app
 */
function paymentGatewayRoute(app) {
    let router = express.Router();

    router.post('/buy', AuthTokenMiddleware(), PaymentController.buy);
    router.get('/structs', AuthTokenMiddleware(), PaymentController.getStructs);
    router.get(
        '/structs/:paymentid',
        AuthTokenMiddleware(),
        PaymentController.getOneStruct
    );
    router.get(
        '/structs/:paymentid/cancel',
        AuthTokenMiddleware(),
        PaymentController.cancelPayment
    );
    router.use('/midtrans', MidtransOriginMiddleware());
    router.post(
        '/midtrans/payment-notification-receiver',
        MidtransVerifyNotificationMiddleware(),
        PaymentController.midtransPaymentNotificationReceiver
    );

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

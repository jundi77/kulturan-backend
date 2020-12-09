/**
 * Supaya .env dapat diakses melalui
 * process.env
 */
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const utils = require('./utils');
const app = express();
const midtransClient = require('midtrans-client');
const { getClientIp } = require('@supercharge/request-ip');

/**
 * Import yang diperlukan ke global
 */
global.kulturan = {};
global.kulturan.utils = utils;
global.kulturan.midtrans = {};
global.kulturan.midtrans.snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
});
global.kulturan.googleapis = require('googleapis');
global.kulturan.getClientIp = getClientIp;
global.kulturan.log = {};
global.kulturan.log.discord = require('./controllers/LogController');
global.kulturan.models = {};
global.kulturan.models.Pembayaran = {};
global.kulturan.models.Pembayaran.nanoid = require('./config/PaymentNanoIdConfig')(
    require('nanoid')
);

/**
 * app.use apaan?
 * buat nambah middleware.
 *
 * Kok nggak ada pathnya?
 * Kalau nggak ada pathnya, berarti buat general.
 *
 * https://stackoverflow.com/questions/11321635/nodejs-express-what-is-app-use#11321828
 */
// cors global
app.use(cors());

// parse body ke json
app.use(express.json());
app.use((err, req, res, next) => {
    if (err) {
        return res.status(400).json({
            status: 'failed',
            msg: 'bad request, attention please?',
        });
    }
    return next();
});

mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    })
    .then(() => {
        console.log('DB Connected');
    })
    .catch((err) => {
        console.error(err);
        throw err;
    });

let apiRoute = require('./routes/api');
apiRoute.authRoute(app);
apiRoute.userRoute(app);
apiRoute.videoRoute(app);
apiRoute.paymentGatewayRoute(app);
app.use('/', (req, res) => {
    console.log(req);
    return res.status(404).json({
        status: 'failed',
        msg: 'You get lost.',
    });
});

module.exports = app;

/**
 * Supaya .env dapat diakses melalui
 * process.env
 */
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const cors = require('cors');
const utils = require('./utils');
const app = express();

/**
 * Import yang diperlukan ke global
 */
global.kulturan = {};
global.kulturan.utils = utils;

/**
 * app.use apaan?
 * buat nambah middleware.
 *
 * Kok nggak ada pathnya?
 * Kalau nggak ada pathnya, berarti buat general.
 *
 * https://stackoverflow.com/questions/11321635/nodejs-express-what-is-app-use#11321828
 */
// parse body ke json
app.use(express.json());

// cors global
app.use(cors());

// connect ke mongoooooooooodb
mongoose
    .connect(process.env.MONGO_URI, {
        // config disuruh sama mongodb
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

module.exports = app;

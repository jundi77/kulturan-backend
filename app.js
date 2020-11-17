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
const testToken = require('./controllers/auth/TestTokenController');
const passportBearerConfig = require('./config/passport');
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

// intialize passport
app.use(passport.initialize());

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

        // kalau udah connect, initialize passport
        passportBearerConfig(passport);
    })
    .catch((err) => {
        console.error(err);
        throw err;
    });

app.use('/', require('./routes/web'));
app.use('/test-middleware', passport.authenticate('jwt'), (req, res) => {
    res.status(200).json({ status: 'success' });
    return;
});
module.exports = app;

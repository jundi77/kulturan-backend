/**
 * Unfinished, butuh referensi lebih banyak
 */
const JWTStrategy = require('passport-jwt').Strategy;
const mongoose = require('mongoose');
const passport = require('passport');
const { ExtractJwt } = require('passport-jwt');

const passportBearerConfig = (passport) => {
    /**
     * Fungsi ini rencananya untuk validasi bearer token
     * https://stackoverflow.com/questions/25838183/what-is-the-oauth-2-0-bearer-token-exactly
     */
    const User = mongoose.model('users');
    const opts = {};
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    opts.secretOrKey = process.env.secretOrKey;
    passport.use(
        new JWTStrategy(opts, (jwt_payload, done) => {
            User.findById(jwt_payload.id)
                .then((user) => {
                    if (user) {
                        /**
                         * done(error, user, info)
                         */
                        return done(null, user);
                    }
                    return done(null, false);
                })
                .catch((err) => console.error(err));
        })
    );
};

module.exports = passportBearerConfig;

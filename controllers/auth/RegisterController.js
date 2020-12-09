const bcrypt = require('bcryptjs');
const validateRegisterInput = require('../form/validation/RegisterFormValidation');
const User = require('../../models/User');
const LoginController = require('./LoginController');
const axios = require('axios');
require('../form/validation/RegisterFormValidation');

const RegisterController = (req, res) => {
    let { errors, isValid } = validateRegisterInput(req.body);
    if (!isValid) {
        errors = { msg: errors };
        errors.status = 'failed';
        res.status(400).json(errors);
        return;
    }

    User.findOne({ email: req.body.email })
        .then((user) => {
            console.log(user);
            if (user) {
                errors.status = 'failed';
                errors.msg = 'Email telah terdaftar';
                res.status(400).json(errors);
                return;
            }

            const newUser = new User({
                name: req.body.name,
                email: req.body.email,
                password: req.body.password,
            });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) {
                        console.error(err);
                    }
                    newUser.password = hash;
                    newUser.save().then((user) => {
                        global.kulturan.log.discord(
                            req,
                            `User baru \`${newUser.email}\` telah terdaftar`
                        );
                        return LoginController(req, res);
                    });
                });
            });
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        });
};

module.exports = RegisterController;

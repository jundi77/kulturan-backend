const bcrypt = require('bcryptjs');
const validateRegisterInput = require('../form/validation/RegisterFormValidation');
const User = require('../../models/User');
const LoginController = require('./LoginController');
require('../form/validation/RegisterFormValidation');

const RegisterController = (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);
    if (!isValid) {
        errors.status = 'failed';
        res.status(400).json(errors);
        return;
    }

    User.findOne({ email: req.body.email })
        .then((user) => {
            console.log(user);
            if (user) {
                errors.status = 'failed';
                errors.email = 'Email telah terdaftar';
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
                        return LoginController(req, res);
                    });
                });
            });
        })
        .catch((err) => console.error(err));
};

module.exports = RegisterController;

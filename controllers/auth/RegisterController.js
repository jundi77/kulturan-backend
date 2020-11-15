const bcrypt = require('bcryptjs');
const validateRegisterInput = require('../form/validation/RegisterFormValidation');
const User = require('../../models/User');
require('../form/validation/RegisterFormValidation');

const RegisterController = (req, res) => {
    const { errors, isValid } = validateRegisterInput(req.body);
    if (!isValid) {
        res.status(400).json(errors);
        return;
    }

    User.findOne({ email: req.body.email })
        .then((user) => {
            console.log(user);
            if (user) {
                errors.email = 'User already exists';
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
                    newUser
                        .save()
                        .then((user) =>
                            res.status(200).json({ status: 'success' })
                        )
                        .catch((err) => {
                            // console.error(err);
                        });
                });
            });
        })
        .catch((err) => console.error(err));
};

module.exports = RegisterController;

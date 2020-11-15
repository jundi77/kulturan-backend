const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const LoginFormValidation = require('../form/validation/LoginFormValidation');
const User = require('../../models/User');
const validateLoginInput = require('../form/validation/LoginFormValidation');

const LoginController = (req, res) => {
    // validasi dulu bener nggak isi requestnya
    const { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
        res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                errors.email = 'Email is wrong';
                res.status(400).json(errors);
                return;
            }

            // Compare password yang di request dengan yang disimpan
            bcrypt.compare(req.body.password, user.password).then((isMatch) => {
                if (!isMatch) {
                    errors.password = 'Wrong password';
                    res.status(400).json(errors);
                    return;
                }

                /**
                 * Payload untuk JWT **
                 * Ini bisa diparsing di client untuk digunakan sebagai data user,
                 * namun tidak bisa diubah setelah token dibuat.
                 */
                const payload = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };

                JWT.sign(
                    payload,
                    process.env.secretOrKey,
                    {
                        expiresIn: 31556926, // a year
                    },
                    (err, token) => {
                        if (err) {
                            console.error(err);
                            throw err;
                        }
                        res.status(200).json({
                            success: true,
                            token,
                        });
                    }
                );
            });
        })
        .catch((err) => console.error(err));
};

module.exports = LoginController;

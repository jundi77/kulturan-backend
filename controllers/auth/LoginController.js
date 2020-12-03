const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');
const User = require('../../models/User');
const validateLoginInput = require('../form/validation/LoginFormValidation');

const LoginController = (req, res) => {
    // validasi dulu bener nggak isi requestnya
    let { errors, isValid } = validateLoginInput(req.body);
    if (!isValid) {
        errors = { msg: errors };
        errors.status = 'failed';
        return res.status(400).json(errors);
    }

    User.findOne({ email: req.body.email })
        .then((user) => {
            if (!user) {
                errors.status = 'failed';
                errors.msg = 'Email atau password salah';
                return res.status(400).json(errors);
                // return res.send(errors);
            }

            // Compare password yang di request dengan yang disimpan
            bcrypt.compare(req.body.password, user.password).then((isMatch) => {
                if (!isMatch) {
                    errors.status = 'failed';
                    errors.msg = 'Email atau password salah';
                    return res.status(400).json(errors);
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
                            status: 'success',
                            data: {
                                token,
                            },
                        });
                    }
                );
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

module.exports = LoginController;

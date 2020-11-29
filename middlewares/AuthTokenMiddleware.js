const jwt = require('jsonwebtoken');
const { ExtractJwt } = require('passport-jwt');

function verifyToken(options) {
    return function (req, res, next) {
        const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
        const token = jwtFromRequest(req);
        if (!token) {
            res.status(200).json({
                status: 'failed',
                msg: 'Bearer token is required',
            });
            return;
        }

        try {
            const decoded = jwt.verify(token, process.env.secretOrKey);
            User.findOne({ _id: decoded.id })
                .then((user) => {
                    if (user) {
                        const { id, name, email } = user;
                        if (decoded.email !== user.email) {
                            return res.status(200).json({
                                status: 'failed',
                                msg: 'Invalid token',
                            });
                        }
                        res.locals.user = {
                            status: 'success',
                            data: { id, name, email },
                        };
                        if (options && options.sendUserData === true) {
                            return res.status(200).json(res.locals.user);
                        }
                        return next();
                    }
                    return res.status(200).json({
                        status: 'failed',
                        msg: 'Invalid user',
                    });
                })
                .catch((err) => console.error(err));
        } catch (error) {
            return res
                .status(200)
                .json({ status: 'failed', msg: 'Invalid token' });
        }
    };
}

module.exports = verifyToken;

/**
 * Untuk verifikasi apakah request beneran datang
 * dari midtrans.
 *
 * @author Jundi
 * @param {Object} options
 * @return {function (req, res, next)}
 */
function checkRequestOrigin(options) {
    return function (req, res, next) {
        if (options && options.log === true) {
            console.debug(req.headers);
        }
        if (
            req.headers['user-agent'] === 'Veritrans' &&
            ((req.headers['x-forwarded-for'] instanceof Array &&
                req.headers['x-forwarded-for'].find(
                    (ip) => ip === '103.58.103.177'
                )) ||
                req.headers['x-forwarded-for'] === '103.58.103.177')
        ) {
            return next();
        } else {
            return res.status(403).json({
                status: 'failed',
                msg: 'Who are you?',
            });
        }
    };
}

module.exports = checkRequestOrigin;

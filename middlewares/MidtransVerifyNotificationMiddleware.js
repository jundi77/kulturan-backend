const crypto = require('crypto');

/**
 * Untuk cek kalau signature_key
 * valid, sesuai aturan dari
 * midtrans.
 *
 * @author Jundi
 * @param {Object} options
 * @return {function (req, res, next)}
 */
function verifyNotification(options) {
    return function (req, res, next) {
        if (options && options.log === true) {
            console.log(req.body);
        }
        if (req.body.hasOwnProperty('signature_key')) {
            try {
                let order_id = req.body.order_id;
                let status_code = req.body.status_code;
                let gross_amount = req.body.gross_amount;
                if (
                    crypto
                        .createHash('sha512')
                        .update(
                            '' +
                                order_id +
                                status_code +
                                gross_amount +
                                process.env.MIDTRANS_SERVER_KEY,
                            'utf-8'
                        )
                        .digest('hex') === req.body.signature_key
                ) {
                    if (options && options.log === true) {
                        console.log('signature key verified');
                    }
                    return next();
                }
            } catch (error) {
                console.error(error);
                return res.status(400).json({
                    status: 'failed',
                    msg: "I don't understand",
                });
            }
        }
    };
}

module.exports = verifyNotification;

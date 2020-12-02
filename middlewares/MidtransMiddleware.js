function checkRequestOrigin(options) {
    return function (req, res, next) {
        if (options && options.log === true) {
            console.log(req.hostname);
            console.log(req.body);
            return res.status(200).json({
                status: 'success',
                data: {
                    host: req.headers.host,
                    origin: req.headers.origin,
                    address: req.socket.remoteAddress,
                },
            });
        }
        return next();
    };
}

module.exports = checkRequestOrigin;

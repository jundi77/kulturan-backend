function checkRequestOrigin(options) {
    return function (req, res, next) {
        if (options && options.log === true) {
            console.log(req.hostname);
            console.log(req.body);
            return res.status(200).json({
                status: 'success',
                data: {
                    req,
                },
            });
        }
        return next();
    };
}

module.exports = checkRequestOrigin;

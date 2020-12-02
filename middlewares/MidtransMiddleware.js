function checkRequestOrigin(options) {
    return function (req, res, next) {
        if (options && options.log === true) {
            console.log(req.hostname);
            console.log(req.body);
        }
        return next();
    };
}

module.exports = checkRequestOrigin;

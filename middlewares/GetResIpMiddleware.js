function GetResIpMiddleware(options) {
    return (req, res, next) => {
        req.ip = {};
        req.ip.address = global.kulturan.getClientIp(req);

        next();
    };
}

module.exports = GetResIpMiddleware;

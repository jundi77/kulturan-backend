const { getClientIp } = require('@supercharge/request-ip');

function GetResIpMiddleware(options) {
    return (req, res, next) => {
        req.ip_details = {};
        req.ip_details.address = getClientIp(req);
        console.log(req.ip);

        next();
    };
}

module.exports = GetResIpMiddleware;

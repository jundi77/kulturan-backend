const axios = require('axios');
function logOnDiscord(req, msg) {
    axios.post(process.env.DISCORD_LOG_BOT, {
        content: `${msg}, melalui \`${req.ip_details.address}\`.`,
    });
}

module.exports = logOnDiscord;

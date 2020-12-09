const axios = require('axios');
function logOnDiscord(req, msg) {
    axios.post(process.env.DISCORD_LOG_BOT, {
        content: `${msg}, melalui \`${req.ip.address}\`.`,
    });
}

module.exports = logOnDiscord;

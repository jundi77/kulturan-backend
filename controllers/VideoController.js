function getAll(req, res) {}

const getFromID = (req, res) => {
    return res.status(200).json(req.params);
};

function getPremiumLink(req, res) {}

module.exports = {
    getAll,
    getFromID,
    getPremiumLink,
};

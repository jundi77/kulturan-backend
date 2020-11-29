const Video = require('../models/Video');
const Kategori = require('../models/Kategori');

function getAll(req, res) {
    let videos = null;
    Video.find({})
        .populate('categories')
        .select(['link.thumbnail', 'title', 'pementas', 'price'])
        .then((videos) => {
            return res.status(200).json({
                status: 'success',
                data: {
                    videos,
                },
            });
        })
        .catch((err) => {
            console.error(err);
            return res.status(200).json({
                status: 'failed',
            });
        });
}

const getFromID = (req, res) => {
    return res.status(200).json(req.params);
};

function getPremiumLink(req, res) {}

module.exports = {
    getAll,
    getFromID,
    getPremiumLink,
};

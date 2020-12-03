const mongoose = require('mongoose');
const Video = require('../models/Video');
const Kategori = require('../models/Kategori');

function getAll(req, res) {
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
            return res.status(500).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        });
}

function checkPayment(videoID, user) {
    return null;
}

function getFromID(req, res) {
    let id = req.params.videoid;
    let video = Video.findById(id);
    if (res.locals && res.locals.user) {
        // kalau sudah ready, ini jalan
        if (checkPayment(id, res.locals.user)) {
            video = video.select(['-link.stage']); // sementara belum ngecek sudah mbayar atau belum
        }
    } else {
        video = video.select(['-link.stage']); // sementara belum ngecek sudah mbayar atau belum
    }

    video
        .populate('categories')
        .then((video) => {
            if (video) {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        video,
                    },
                });
            }
            return res.status(404).json({
                status: 'failed',
                msg: 'Video tidak ditemukan',
            });
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        });
}

module.exports = {
    getAll,
    getFromID,
};

const mongoose = require('mongoose');
const Video = require('../models/Video');
const Pembayaran = require('../models/Pembayaran');
const Kategori = require('../models/Kategori');

function getAll(req, res) {
    Video.find({})
        .populate('categories')
        .select(['link.thumbnail', 'title', 'pementas', 'price', 'categories'])
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

function getFromID(req, res) {
    const getVideoDetails = (video) => {
        video
            .populate('categories')
            .then((video) => {
                if (video) {
                    let now = Date();
                    if (now < video.tanggal.pementasan) {
                        video = video.toObject();
                        if (video.hasOwnProperty('link')) {
                            delete video.link.stage;
                        }
                    }
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
    };

    let id = req.params.videoid;
    let video = Video.findById(id);
    if (res.locals && res.locals.user) {
        // kalau sudah ready, ini jalan
        Pembayaran.findOne({
            userID: res.locals.user.data.id,
            paid: true,
            itemDetails: id,
        }).then((struct) => {
            if (!struct) {
                video = video.select(['-link.stage']); // sementara belum ngecek sudah mbayar atau belum
            }
            return getVideoDetails(video);
        });
    } else {
        video = video.select(['-link.stage']); // sementara belum ngecek sudah mbayar atau belum
        return getVideoDetails(video);
    }
}

module.exports = {
    getAll,
    getFromID,
};

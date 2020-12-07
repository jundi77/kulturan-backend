const mongoose = require('mongoose');
const Video = require('../models/Video');
const Pembayaran = require('../models/Pembayaran');
const Kategori = require('../models/Kategori');

function getAll(req, res) {
    Video.find({})
        .populate('categories')
        .select(['link.thumbnail', 'title', 'pementas', 'price', 'categories'])
        .sort('-createdAt title')
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
    const getVideoDetails = (video, paid = null) => {
        video
            .populate('categories')
            .then((video) => {
                if (video) {
                    // let now = Date();
                    // if (now < video.tanggal.pementasan) {
                    //     video = video.toObject();
                    //     if (video.hasOwnProperty('link')) {
                    //         delete video.link.stage;
                    //     }
                    // }
                    video.paid = paid;
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
                video = video.select(['-link.stage']);
                return getVideoDetails(video, false);
            }
            return getVideoDetails(video, true);
        });
    } else {
        video = video.select(['-link.stage']);
        return getVideoDetails(video, false);
    }
}

function isPaid(req, res) {
    let id = req.params.videoid;
    if (res.locals && res.locals.user) {
        Pembayaran.findOne({
            userID: res.locals.user.data.id,
            paid: true,
            itemDetails: id,
        })
            .then((struct) => {
                return res.status(200).json({
                    status: 'success',
                    data: {
                        paid: struct ? true : false,
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
    } else {
        return res.status(200).json({
            status: 'success',
            data: {
                paid: false,
            },
        });
    }
}
function getPaidVideos(req, res) {}

module.exports = {
    getAll,
    getFromID,
    isPaid,
    getPaidVideos,
};

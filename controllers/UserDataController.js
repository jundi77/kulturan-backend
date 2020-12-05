const User = require('../models/User');
const Video = require('../models/Video');
const bcrypt = require('bcryptjs');
const validateUserData = require('./form/validation/EditAccountFormValidation');
const JWT = require('jsonwebtoken');
const objectID = require('mongoose').Types.ObjectId;

function editAccount(req, res) {
    let { errors, isValid, empty } = validateUserData(req.body);
    if (!isValid) {
        errors = { msg: errors };
        errors.status = 'failed';
        return res.status(400).json(errors);
    }
    if (empty) {
        return res.status(200).json({
            status: 'success',
        });
    }
    User.findOne({ _id: res.locals.user.data.id })
        .then((user) => {
            if (!user) {
                return res.status(400).json({
                    status: 'failed',
                    msg: 'Invalid user',
                });
            }

            user.name = req.body.hasOwnProperty('name')
                ? req.body.name
                : user.name;

            if (req.body.hasOwnProperty('email')) {
                user.email = req.body.email;
            }

            if (req.body.hasOwnProperty('newPassword')) {
                bcrypt
                    .compare(req.body.password, user.password)
                    .then((isMatch) => {
                        if (!isMatch) {
                            errors.status = 'failed';
                            errors.msg = 'Password salah';
                            return res.status(400).json(errors);
                        }

                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(
                                req.body.password,
                                salt,
                                (err, hash) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({
                                            status: 'failed',
                                            msg: 'SERVER ERROR',
                                        });
                                    }
                                    user.password = hash;
                                }
                            );
                        });
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            status: 'failed',
                            msg: 'SERVER ERROR',
                        });
                    });
            }

            user.save()
                .then((user) => {
                    /**
                     * Payload untuk JWT **
                     * Ini bisa diparsing di client untuk digunakan sebagai data user,
                     * namun tidak bisa diubah setelah token dibuat.
                     */
                    const payload = {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                    };

                    JWT.sign(
                        payload,
                        process.env.secretOrKey,
                        {
                            expiresIn: 31556926, // a year
                        },
                        (err, token) => {
                            if (err) {
                                console.error(err);
                                throw err;
                            }
                            res.status(200).json({
                                status: 'success',
                                data: {
                                    token,
                                    id: user.id,
                                    name: user.name,
                                    email: user.email,
                                },
                            });
                        }
                    );
                })
                .catch((err) => {
                    return res.status(400).json({
                        status: 'failed',
                        msg: 'Email telah terdaftar.',
                    });
                });
        })
        .catch((err) => {
            return res.status(500).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        });
}
function getKeranjang(req, res) {
    User.findOne({ _id: res.locals.user.data.id })
        .populate({
            path: 'keranjang',
            model: 'videos',
            select: ['link.thumbnail', 'title', 'pementas', 'price'],
        })
        .then((user) => {
            return res.status(200).json({
                status: 'success',
                data: {
                    keranjang: user.keranjang,
                },
            });
        })
        .catch((err) => {
            return res.status(500).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        });
}
function addToKeranjang(req, res) {
    // cek dulu kalau sudah pernah beli
    if (req.body.hasOwnProperty('videoID')) {
        if (!objectID.isValid(req.body.videoID)) {
            return res.status(400).json({
                status: 'failed',
                msg: {
                    videoID: 'ID video tidak valid',
                },
            });
        }
        Video.findOne({ _id: req.body.videoID })
            .then((video) => {
                if (!video) {
                    return res.status(400).json({
                        status: 'failed',
                        msg: {
                            videoID: 'Video tidak ditemukan',
                        },
                    });
                }
                Pembayaran.findOne({
                    userID: res.locals.user.data.id,
                    itemDetails: req.body.videoID,
                })
                    .then((struct) => {
                        if (struct) {
                            if (struct.paid == true) {
                                return res.status(200).json({
                                    status: 'failed',
                                    msg: 'Video sudah dibeli',
                                    data: {
                                        transactionID: struct._id,
                                    },
                                });
                            } else {
                                switch (
                                    struct.paymentDetails.transactionStatus
                                ) {
                                    case 'pending':
                                        return res.status(200).json({
                                            status: 'failed',
                                            msg:
                                                'Pembelian video sedang diproses',
                                            data: {
                                                transactionID: struct._id,
                                            },
                                        });
                                        break;
                                    default:
                                        if (
                                            struct.paymentDetails.hasOwnProperty(
                                                'transactionToken'
                                            )
                                        ) {
                                            let now = new Date();
                                            if (
                                                now <
                                                struct.paymentDetails
                                                    .transactionTokenExpire
                                            ) {
                                                return res.status(200).json({
                                                    status: 'failed',
                                                    msg:
                                                        'Pembelian untuk video ini belum selesai',
                                                    data: {
                                                        transactionID:
                                                            struct._id,
                                                    },
                                                });
                                            }
                                        }
                                        break;
                                }
                            }
                        }
                        User.findOne({ _id: res.locals.user.data.id })
                            .then((user) => {
                                if (
                                    !user.keranjang.find(
                                        (videoID) => videoID == req.body.videoID
                                    )
                                ) {
                                    user.keranjang.push(req.body.videoID);
                                    user.save()
                                        .then((user) => {
                                            return getKeranjang(req, res);
                                        })
                                        .catch((err) => {
                                            return res.status(500).json({
                                                status: 'failed',
                                                msg: 'DB ERROR',
                                            });
                                        });
                                } else {
                                    return res.status(200).json({
                                        status: 'failed',
                                        msg: 'Video sudah ada di keranjang',
                                    });
                                }
                            })
                            .catch((err) => {
                                return res.status(500).json({
                                    status: 'failed',
                                    msg: 'DB ERROR',
                                });
                            });
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            status: 'failed',
                            msg: 'DB ERROR',
                        });
                    });
            })
            .catch((err) => {
                return res.status(500).json({
                    status: 'failed',
                    msg: 'DB ERROR',
                });
            });
    } else {
        return res.status(401).json({
            status: 'failed',
            msg: 'videoID is required',
        });
    }
}

function removeFromKeranjang(req, res) {
    if (req.body.hasOwnProperty('videoID')) {
        if (!objectID.isValid(req.body.videoID)) {
            return res.status(400).json({
                status: 'failed',
                msg: {
                    videoID: 'ID video tidak valid',
                },
            });
        }
        Video.findOne({ _id: req.body.videoID })
            .then((video) => {
                if (!video) {
                    return res.status(400).json({
                        status: 'failed',
                        msg: {
                            videoID: 'Video tidak ditemukan',
                        },
                    });
                }
                User.findOne({ _id: res.locals.user.data.id })
                    .then((user) => {
                        let index = user.keranjang.findIndex(
                            (videoID) => videoID == req.body.videoID
                        );
                        if (index > -1) {
                            user.keranjang.splice(index, 1);
                        }
                        user.save()
                            .then((user) => {
                                return getKeranjang(req, res);
                            })
                            .catch((err) => {
                                return res.status(500).json({
                                    status: 'failed',
                                    msg: 'DB ERROR',
                                });
                            });
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            status: 'failed',
                            msg: 'DB ERROR',
                        });
                    });
            })
            .catch((err) => {
                return res.status(500).json({
                    status: 'failed',
                    msg: 'DB ERROR',
                });
            });
    } else {
        return res.status(401).json({
            status: 'failed',
            msg: 'videoID is required',
        });
    }
}

function getFavorit(req, res) {
    User.findOne({ _id: res.locals.user.data.id })
        .populate({
            path: 'favorit',
            model: 'videos',
            select: ['link.thumbnail', 'title', 'pementas', 'price'],
        })
        .then((user) => {
            return res.status(200).json({
                status: 'success',
                data: {
                    favorit: user.favorit,
                },
            });
        })
        .catch((err) => {
            return res.status(500).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        });
}

function addToFavorit(req, res) {
    if (req.body.hasOwnProperty('videoID')) {
        if (!objectID.isValid(req.body.videoID)) {
            return res.status(400).json({
                status: 'failed',
                msg: {
                    videoID: 'ID video tidak valid',
                },
            });
        }
        let videoFound;
        Video.findOne({ _id: req.body.videoID })
            .then((video) => {
                if (!video) {
                    return res.status(400).json({
                        status: 'failed',
                        msg: {
                            videoID: 'Video tidak ditemukan',
                        },
                    });
                }
                videoFound = video;
                User.findOne({ _id: res.locals.user.data.id })
                    .then((user) => {
                        if (
                            !user.favorit.find(
                                (videoID) => videoID == req.body.videoID
                            )
                        ) {
                            user.favorit.push(req.body.videoID);
                            ++videoFound.favorit;
                            videoFound.save();
                            user.save()
                                .then((user) => {
                                    return getFavorit(req, res);
                                })
                                .catch((err) => {
                                    return res.status(500).json({
                                        status: 'failed',
                                        msg: 'DB ERROR',
                                    });
                                });
                        } else {
                            return res.status(200).json({
                                status: 'failed',
                                msg: 'Video sudah ada di favorit',
                            });
                        }
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            status: 'failed',
                            msg: 'DB ERROR',
                        });
                    });
            })
            .catch((err) => {
                return res.status(500).json({
                    status: 'failed',
                    msg: 'DB ERROR',
                });
            });
    } else {
        return res.status(401).json({
            status: 'failed',
            msg: 'videoID is required',
        });
    }
}
function removeFromFavorit(req, res) {
    if (req.body.hasOwnProperty('videoID')) {
        if (!objectID.isValid(req.body.videoID)) {
            return res.status(400).json({
                status: 'failed',
                msg: {
                    videoID: 'ID video tidak valid',
                },
            });
        }
        let videoFound;
        Video.findOne({ _id: req.body.videoID })
            .then((video) => {
                if (!video) {
                    return res.status(400).json({
                        status: 'failed',
                        msg: {
                            videoID: 'Video tidak ditemukan',
                        },
                    });
                }
                videoFound = video;
                User.findOne({ _id: res.locals.user.data.id })
                    .then((user) => {
                        let index = user.favorit.findIndex(
                            (videoID) => videoID == req.body.videoID
                        );
                        if (index > -1) {
                            user.favorit.splice(index, 1);
                            --videoFound.favorit;
                            videoFound.save();
                        }
                        user.save()
                            .then((user) => {
                                return getFavorit(req, res);
                            })
                            .catch((err) => {
                                return res.status(500).json({
                                    status: 'failed',
                                    msg: 'DB ERROR',
                                });
                            });
                    })
                    .catch((err) => {
                        return res.status(500).json({
                            status: 'failed',
                            msg: 'DB ERROR',
                        });
                    });
            })
            .catch((err) => {
                return res.status(500).json({
                    status: 'failed',
                    msg: 'DB ERROR',
                });
            });
    } else {
        return res.status(401).json({
            status: 'failed',
            msg: 'videoID is required',
        });
    }
}

module.exports = {
    editAccount,
    getKeranjang,
    addToKeranjang,
    removeFromKeranjang,
    getFavorit,
    addToFavorit,
    removeFromFavorit,
};

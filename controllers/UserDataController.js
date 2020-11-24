const User = require('../models/User');
const Video = require('../models/Video');
const bcrypt = require('bcryptjs');
const validateUserData = require('./form/validation/EditAccountFormValidation');
const JWT = require('jsonwebtoken');
const objectID = require('mongoose').Types.ObjectId;

function editAccount(req, res) {
    try {
        const { errors, isValid, empty } = validateUserData(req.body);
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
                                errors = { msg: errors };
                                errors.status = 'failed';
                                errors.msg.password = 'Password salah';
                                return res.status(400).json(errors);
                            }

                            bcrypt.genSalt(10, (err, salt) => {
                                bcrypt.hash(
                                    req.body.password,
                                    salt,
                                    (err, hash) => {
                                        if (err) {
                                            console.error(err);
                                        }
                                        user.password = hash;
                                    }
                                );
                            });
                        });
                }

                user.save().then((user) => {
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
                });
            })
            .catch((err) => {
                return res.status(400).json({
                    status: 'failed',
                });
            });
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            status: 'failed',
        });
    }
}
function getKeranjang(req, res) {
    User.findOne({ _id: res.locals.user.data.id })
        .then((user) => {
            return res.status(200).json({
                status: 'success',
                data: {
                    keranjang: user.keranjang,
                },
            });
        })
        .catch((err) => {
            return res.status(400).json({
                status: 'failed',
            });
        });
}
function addToKeranjang(req, res) {
    try {
        if (req.body.hasOwnProperty('videoID')) {
            if (!objectID.isValid(req.body.videoID)) {
                return res.status(400).json({
                    status: 'failed',
                    msg: {
                        videoID: 'ID video tidak valid',
                    },
                });
            }
            Video.findOne({ _id: req.body.videoID }).then((video) => {
                if (!video) {
                    return res.status(400).json({
                        status: 'failed',
                        msg: {
                            videoID: 'Video tidak ditemukan',
                        },
                    });
                }
            });
            User.findOne({ _id: res.locals.user.data.id })
                .then((user) => {
                    if (
                        !user.keranjang.find(
                            (videoID) => videoID == req.body.videoID
                        )
                    ) {
                        user.keranjang.push(req.body.videoID);
                        user.save().then((user) => {
                            return res.status(200).json({
                                status: 'success',
                                data: {
                                    keranjang: user.keranjang,
                                },
                            });
                        });
                    }
                })
                .catch((err) => {
                    if (err) throw err;
                });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            status: 'failed',
        });
    }
}

function removeFromKeranjang(req, res) {
    try {
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
                })
                .catch((err) => {
                    if (err) throw err;
                });
            User.findOne({ _id: res.locals.user.data.id })
                .then((user) => {
                    let index = keranjang.findIndex(
                        (videoID) => videoID == req.body.videoID
                    );
                    if (index) {
                        user.keranjang.splice(index, 1);
                        user.save().then((user) => {
                            return res.status(200).json({
                                status: 'success',
                                data: {
                                    keranjang: user.keranjang,
                                },
                            });
                        });
                    }
                })
                .catch((err) => {
                    if (err) throw err;
                });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            status: 'failed',
        });
    }
}

function getFavorit(req, res) {
    User.findOne({ _id: res.locals.user.data.id })
        .then((user) => {
            return res.status(200).json({
                status: 'success',
                data: {
                    favorit: user.favorit,
                },
            });
        })
        .catch((err) => {
            return res.status(400).json({
                status: 'failed',
            });
        });
}

function addToFavorit(req, res) {
    try {
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
                })
                .catch((err) => {
                    if (err) throw err;
                });
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
                        user.save().then((user) => {
                            return res.status(200).json({
                                status: 'success',
                                data: {
                                    favorit: user.favorit,
                                },
                            });
                        });
                    }
                })
                .catch((err) => {
                    if (err) throw err;
                });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            status: 'failed',
        });
    }
}
function removeFromFavorit(req, res) {
    try {
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
                })
                .catch((err) => {
                    if (err) throw err;
                });
            User.findOne({ _id: res.locals.user.data.id })
                .then((user) => {
                    let index = favorit.findIndex(
                        (videoID) => videoID == req.body.videoID
                    );
                    if (index) {
                        user.favorit.splice(index, 1);
                        --videoFound.favorit;
                        videoFound.save();
                        user.save().then((user) => {
                            return res.status(200).json({
                                status: 'success',
                                data: {
                                    favorit: user.favorit,
                                },
                            });
                        });
                    }
                })
                .catch((err) => {
                    if (err) throw err;
                });
        }
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            status: 'failed',
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

const mongoose = require('mongoose');
const User = require('../models/User');
const Video = require('../models/Video');
const Pembayaran = require('../models/Pembayaran');
const e = require('express');

function payWithSnap(res, parameter) {
    global.kulturan.midtrans.snap
        .createTransaction(parameter)
        .then((transaction) => {
            return res.status(200).json({
                status: 'success',
                data: {
                    transactionToken: transaction.token,
                    redirectURL: transaction.redirect_url,
                },
            });
        })
        .catch((err) => {
            console.error(err);
            return res.status(503).json({
                status: 'failed',
                msg: 'Service payment sedang tidak tesedia',
            });
        });
}

function makePembayaran(res, snapParameter, data) {
    let newPembayaran = new Pembayaran(data);
    newPembayaran.save((err) => {
        if (err) {
            console.error(err);
            return res.status(400).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        }
        snapParameter.transaction_details = {
            order_id: newPembayaran._id,
            gross_amount: newPembayaran.totalPrice,
        };
        return payWithSnap(res, snapParameter);
    });
}

function buy(req, res) {
    let parameter = {
        customer_details: {
            first_name: res.locals.user.data.name, // perlu perhatian batas karakter nantinya
            email: res.locals.user.data.email,
        },
        credit_card: {
            secure: true,
        },
        callbacks: {
            finish: 'https://example.com', // diisi url callback kalau finish
        },
    };
    if (req.body.hasOwnProperty('videoID')) {
        if (mongoose.Types.ObjectId.isValid(req.body.videoID)) {
            Video.findById(req.body.videoID)
                .then((video) => {
                    if (video) {
                        parameter.item_details = [
                            {
                                id: video._id,
                                price: video.price,
                                quantity: 1,
                                name: video.title,
                                brand: video.pementas,
                                category: 'video',
                                merchant_name: video.pementas,
                            },
                        ];
                        User.findById(res.locals.user.data.id)
                            .then((user) => {
                                if (user) {
                                    let index = user.keranjang.findIndex(
                                        (videoID) => videoID == video._id
                                    );
                                    if (index > -1) {
                                        user.keranjang.splice(index, 1);
                                    }
                                    user.save((err) => {
                                        if (err) {
                                            console.error(err);
                                        }
                                        return makePembayaran(res, parameter, {
                                            userID: res.locals.user.data.id,
                                            paymentDetails: {
                                                item_details:
                                                    parameter.item_details,
                                            },
                                            totalPrice: video.price,
                                        });
                                    });
                                } else {
                                    return res.status(400).json({
                                        status: 'failed',
                                        msg: 'User tidak ditemukan',
                                    });
                                }
                            })
                            .catch((err) => {
                                console.error(err);
                                return res.status(400).json({
                                    status: 'failed',
                                    msg: 'DB ERROR for user',
                                });
                            });
                    } else {
                        return res.status(400).json({
                            status: 'failed',
                            msg: {
                                videoID: 'Video tidak ditemukan',
                            },
                        });
                    }
                })
                .catch((err) => {
                    console.error(err);
                    return res.status(400).json({
                        status: 'failed',
                        msg: 'DB ERROR',
                    });
                });
        } else {
            return res.status(400).json({
                status: 'failed',
                msg: {
                    videoID: 'ID video tidak valid',
                },
            });
        }
    } else {
        // ambil dari keranjang
        User.findById(res.locals.user.data.id)
            .select('keranjang')
            .populate({
                path: 'keranjang',
                model: 'videos',
                select: ['title', 'price', 'pementas'],
            })
            .then((user) => {
                if (user) {
                    let totalPrice = 0;
                    parameter.item_details = user.keranjang.map((video) => {
                        totalPrice += video.price;
                        return {
                            id: video._id,
                            price: video.price,
                            quantity: 1,
                            name: video.title,
                            brand: video.pementas,
                            category: 'video',
                            merchant_name: video.pementas,
                        };
                    });
                    user.keranjang = [];
                    user.save((err) => {
                        if (err) {
                            console.error(err);
                        }
                        return makePembayaran(res, parameter, {
                            userID: res.locals.user.data.id,
                            paymentDetails: {
                                item_details: parameter.item_details,
                            },
                            totalPrice: totalPrice,
                        });
                    });
                } else {
                    return res.status(400).json({
                        status: 'failed',
                        msg: 'User tidak ditemukan',
                    });
                }
            });
    }
}
function getStruct(req, res) {
    return res.status(400).json({
        status: 'failed',
        msg: 'OND',
    });
}
function midtransReceiver(req, res) {
    return res.status(400).json({
        status: 'failed',
        msg: 'OND',
    });
}

module.exports = {
    buy,
    getStruct,
    midtransReceiver,
};

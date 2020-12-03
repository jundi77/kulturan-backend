const mongoose = require('mongoose');
const User = require('../models/User');
const Video = require('../models/Video');
const Pembayaran = require('../models/Pembayaran');
const axios = require('axios');

function makePembayaran(res, snapParameter, data, user, videoID = null) {
    let pembayaran = new Pembayaran(data);
    pembayaran.save((err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                status: 'failed',
                msg: 'DB ERROR',
            });
        }
        snapParameter.transaction_details = {
            order_id: pembayaran._id,
            gross_amount: pembayaran.totalPrice,
        };
        global.kulturan.midtrans.snap
            .createTransaction(snapParameter)
            .then((transaction) => {
                Pembayaran.findOneAndUpdate(
                    { _id: pembayaran._id },
                    {
                        $set: {
                            'paymentDetails.transactionToken':
                                transaction.token,
                        },
                    },
                    (err, pembayaran) => {
                        if (videoID) {
                            let index = user.keranjang.findIndex(
                                (videoID) => videoID == req.body.videoID
                            );
                            if (index > -1) {
                                user.keranjang.splice(index, 1);
                                user.markModified('keranjang');
                            }
                        } else {
                            user.keranjang = [];
                            user.markModified('keranjang');
                        }
                        user.save();
                        if (err) {
                            console.error(err);
                            return res.status(200).json({
                                status: 'success',
                                data: {
                                    transactionToken: transaction.token,
                                    redirectURL: transaction.redirect_url,
                                },
                                msg: 'Warning: token not saved',
                            });
                        }
                        return res.status(200).json({
                            status: 'success',
                            data: {
                                transactionToken: transaction.token,
                                redirectURL: transaction.redirect_url,
                            },
                        });
                    }
                );
            })
            .catch((err) => {
                // kembalikan keranjang seperti semula harusnya
                console.error(err);
                return res.status(503).json({
                    status: 'failed',
                    msg:
                        'Service payment sedang tidak tesedia, mohon coba beberapa saat lagi',
                });
            });
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
    };
    if (req.body.hasOwnProperty('videoID')) {
        if (mongoose.Types.ObjectId.isValid(req.body.videoID)) {
            Video.findById(req.body.videoID)
                .then((video) => {
                    if (video) {
                        // cek kalau sudah pernah beli
                        parameter.item_details = [
                            {
                                videoID: video._id,
                                price: video.price,
                                quantity: 1,
                                name: video.title,
                                brand: video.pementas,
                                category: 'video',
                                merchant_name: video.pementas,
                            },
                        ];
                        User.findOne({ _id: res.locals.user.data.id })
                            .then((user) => {
                                return makePembayaran(
                                    res,
                                    parameter,
                                    {
                                        userID: res.locals.user.data.id,
                                        itemDetails: [
                                            parameter.item_details[0].videoID,
                                        ],
                                        totalPrice: video.price,
                                    },
                                    user,
                                    req.body.videoID
                                );
                            })
                            .catch((err) => {
                                return res.status(500).json({
                                    status: 'failed',
                                    msg: 'DB ERROR',
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
                    return res.status(500).json({
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
                    if (user.keranjang.length > 0) {
                        let totalPrice = 0;
                        parameter.item_details = user.keranjang.map((video) => {
                            totalPrice += video.price;
                            return {
                                videoID: video._id,
                                price: video.price,
                                quantity: 1,
                                name: video.title,
                                brand: video.pementas,
                                category: 'video',
                                merchant_name: video.pementas,
                            };
                        });
                        return makePembayaran(
                            res,
                            parameter,
                            {
                                userID: res.locals.user.data.id,
                                itemDetails: parameter.item_details.map(
                                    (item) => item.videoID
                                ),
                                totalPrice: totalPrice,
                            },
                            user
                        );
                    } else {
                        return res.status(400).json({
                            status: 'failed',
                            msg: 'Keranjang kosong',
                        });
                    }
                } else {
                    return res.status(400).json({
                        status: 'failed',
                        msg: 'User tidak ditemukan',
                    });
                }
            });
    }
}

function cancelPayment(req, res) {
    axios
        .post(
            `${process.env.MIDTRANS_BASE_URL}/v2/${req.params.paymentid}/cancel`,
            {},
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    Authorization: `Basic ${Buffer.from(
                        process.env.MIDTRANS_SERVER_KEY + ':'
                    ).toString('base64')}`,
                },
            }
        )
        .then((response) => {
            response = response.data;
            if (response.status_code == 200) {
                return res.status(200).json({
                    status: 'success',
                });
            } else {
                return res.status(200).json({
                    status: 'failed',
                    msg: 'Coba lagi setelah beberapa menit',
                });
            }
        })
        .catch((err) => {
            console.error(err);
            return res.status(200).json({
                status: 'failed',
                msg: 'Ada masalah dengan sistem kami, coba beberapa saat lagi',
            });
        });
}

// function scheduleRequest(req, res) scheduling

function getStructs(req, res) {
    Pembayaran.find({ userID: res.locals.user.data.id })
        .select('totalPrice paid paymentDetails')
        .then((structs) => {
            structs = structs.map((struct) => {
                if (struct.paymentDetails.hasOwnProperty('transactionToken')) {
                    struct.paymentDetails.links = {};
                    struct.paymentDetails.links.instruction = `${process.env.MIDTRANS_BASE_URL}/snap/v1/transactions/${struct.paymentDetails.transactionToken}/pdf`;
                }
            });
            return res.status(200).json({
                status: 'success',
                data: {
                    structs,
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

function getOneStruct(req, res) {
    let paymentID = req.params.paymentid;
    Pembayaran.findById(paymentID)
        .select('totalPrice paid paymentDetails')
        .then((struct) => {
            if (struct.paymentDetails.hasOwnProperty('transactionToken')) {
                struct.paymentDetails.links = {};
                struct.paymentDetails.links.instruction = `${process.env.MIDTRANS_BASE_URL}/snap/v1/transactions/${struct.paymentDetails.transactionToken}/pdf`;
            }
            return res.status(200).json({
                status: 'success',
                data: {
                    struct,
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

function notifStatusPembayaran(data) {
    let content = '';
    switch (data.transaction_status) {
        case 'capture':
        case 'settlement':
            if (data.fraud_status === 'accept') {
                content = `Transaksi \`${
                    data.order_id
                }\` sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(data.gross_amount)}\` berhasil diterima.`;
            } else if (data.fraud_status === 'challenge') {
                content = `Transaksi \`${
                    data.order_id
                }\` sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(
                    data.gross_amount
                )}\` telah diverifikasi dan berhasil.`;
            }
            break;
        case 'pending':
            if (data.fraud_status === 'challenge') {
                content = `Transaksi \`${
                    data.order_id
                }\` sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(
                    data.gross_amount
                )}\` diragukan, kontak admin untuk info lebih lanjut.`;
            } else {
                content = `Transaksi baru \`${
                    data.order_id
                }\` sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(data.gross_amount)}\`.`;
            }
            break;
        case 'expire':
            content = `Transaksi \`${
                data.order_id
            }\` sebesar \`${Intl.NumberFormat('id', {
                style: 'currency',
                currency: 'IDR',
            }).format(data.gross_amount)}\` kadaluarsa.`;
            break;
        case 'refund':
            content = `Dana dari transaksi \`${
                data.order_id
            }\` sebesar \`${Intl.NumberFormat('id', {
                style: 'currency',
                currency: 'IDR',
            }).format(data.gross_amount)}\` telah dikembalikan.`;
            break;
        case 'partial_refund':
            content = `Dana dari transaksi \`${
                data.order_id
            }\` sebesar \`${Intl.NumberFormat('id', {
                style: 'currency',
                currency: 'IDR',
            }).format(
                data.gross_amount
            )}\` dikembalikan sejumlah \`${Intl.NumberFormat('id', {
                style: 'currency',
                currency: 'IDR',
            }).format(data.refund_amount)}\`.`;
            break;
        case 'deny':
            if (data.fraud_status === 'deny') {
                content = `Transaksi \`${
                    data.order_id
                }\` sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(
                    data.gross_amount
                )}\` ditolak karena diragukan kebenarannya.`;
            } else {
                content = `Transaksi \`${
                    data.order_id
                }\` sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(data.gross_amount)}\` ditolak.`;
            }
            break;
        case 'cancel':
            content = `Transaksi \`${
                data.order_id
            }\` sebesar \`${Intl.NumberFormat('id', {
                style: 'currency',
                currency: 'IDR',
            }).format(data.gross_amount)}\` dibatalkan.`;
            break;
        default:
            break;
    }

    // notif discord
    axios.post(process.env.DISCORD_MIDTRANS_BOT, { content: content });
}

function midtransPaymentNotificationReceiver(req, res) {
    // konfirmasi kembali
    axios
        .get(
            `${process.env.MIDTRANS_BASE_URL}/v2/${req.body.transaction_id}/status`,
            {
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    Authorization: `Basic ${Buffer.from(
                        process.env.MIDTRANS_SERVER_KEY + ':'
                    ).toString('base64')}`,
                },
            }
        )
        .then((response) => {
            if (response.data.order_id === req.body.order_id) {
                let data = req.body;
                Pembayaran.findById(data.order_id)
                    .then((pembayaran) => {
                        if (pembayaran) {
                            console.log(pembayaran);
                            if (
                                pembayaran.paymentDetails.hasOwnProperty(
                                    'transactionID'
                                ) &&
                                pembayaran.paymentDetails.transactionID ===
                                    data.transaction_id
                            ) {
                                if (data.fraud_status === 'accept') {
                                    switch (data.transaction_status) {
                                        case 'capture':
                                        case 'settlement':
                                            pembayaran.paid = true;
                                            break;
                                        default:
                                            break;
                                    }
                                    if (data.transaction_status != 'pending') {
                                        if (
                                            data.paymentDetails.transactionToken
                                        ) {
                                            delete data.paymentDetails
                                                .transactionToken;
                                        }
                                        if (
                                            data.paymentDetails.links.instruksi
                                        ) {
                                            delete data.paymentDetails.links
                                                .instruksi;
                                        }
                                    }
                                    pembayaran.paymentDetails.transactionStatus =
                                        data.transaction_status;
                                    pembayaran.paymentDetails.fraudStatus =
                                        data.fraud_status;
                                }
                            } else {
                                pembayaran.paymentDetails.transactionID =
                                    data.transaction_id;
                                pembayaran.paymentDetails.paymentType =
                                    data.payment_type;
                                pembayaran.paymentDetails.transactionStatus =
                                    data.transaction_status;
                                pembayaran.paymentDetails.transactionTime = new Date(
                                    data.transaction_time
                                );
                                pembayaran.paymentDetails.merchantID =
                                    data.merchant_id;
                                pembayaran.paymentDetails.fraudStatus =
                                    data.fraud_status;
                            }
                            pembayaran.markModified('paymentDetails');
                            pembayaran.save((err) => {
                                console.log(pembayaran);
                                if (err) {
                                    return res.status(500).json({
                                        status: 'failed',
                                        msg: 'DB ERROR',
                                    });
                                }
                                notifStatusPembayaran(req.body);
                                return res.status(200).json({
                                    status: 'success',
                                });
                            });
                        } else {
                            console.log('pembayaran ga ada');
                            return res.status(404).json({
                                status: 'failed',
                                msg: "Huh? Nothing's here",
                            });
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        return res.status(500).json({
                            status: 'failed',
                        });
                    });
            }
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({
                status: 'failed',
            });
        });
}

module.exports = {
    buy,
    getStructs,
    getOneStruct,
    cancelPayment,
    midtransPaymentNotificationReceiver,
};

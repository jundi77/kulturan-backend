const mongoose = require('mongoose');
const User = require('../models/User');
const Video = require('../models/Video');
const Pembayaran = require('../models/Pembayaran');
const axios = require('axios');

function makePembayaran(res, snapParameter, data, user, videoID = null) {
    let pembayaran = new Pembayaran(data);
    pembayaran.save((err) => {
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
                            'paymentDetails.transaction_token':
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
                            }
                        } else {
                            user.keranjang = [];
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
                        User.findOne({ _id: res.locals.user.data.id })
                            .then((user) => {
                                return makePembayaran(
                                    res,
                                    parameter,
                                    {
                                        userID: res.locals.user.data.id,
                                        paymentDetails: {
                                            item_details:
                                                parameter.item_details,
                                        },
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
                                id: video._id,
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
                                paymentDetails: {
                                    item_details: parameter.item_details,
                                },
                                totalPrice: totalPrice,
                            },
                            user
                        );
                    } else {
                        return res.status(400).json({
                            status: 'success',
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
    return res.status(503).json({
        status: 'failed',
        msg: 'OND',
    });

    // https://api.sandbox.midtrans.com
}

// function scheduleRequest(req, res) scheduling

function getStruct(req, res) {
    return res.status(503).json({
        status: 'failed',
        msg: 'OND',
    });
}

function midtransChallengeVerify(req, res) {}

function notifStatusPembayaran(data) {
    let content = '';
    switch (data.transaction_status) {
        case 'capture':
        case 'settlement':
            if (data.fraud_status === 'accept') {
                content = `Transaksi ${
                    data.order_id
                } sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(data.gross_amount)}\` berhasil diterima.`;
            } else if (data.fraud_status === 'challenge') {
                content = `Transaksi ${
                    data.order_id
                } sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(100000)}\` telah diverifikasi dan berhasil.`;
            }
            break;
        case 'pending':
            if (data.fraud_status === 'challenge') {
                content = `Transaksi ${
                    data.order_id
                } sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(
                    100000
                )}\` diragukan, kontak admin untuk info lebih lanjut.`;
            } else {
                content = `Transaksi baru ${
                    data.order_id
                } sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(100000)}\`.`;
            }
            break;
        case 'expire':
            content = `Transaksi ${data.order_id} sebesar \`${Intl.NumberFormat(
                'id',
                {
                    style: 'currency',
                    currency: 'IDR',
                }
            ).format(data.gross_amount)}\` kadaluarsa.`;
            break;
        case 'refund':
            content = `Dana dari transaksi ${
                data.order_id
            } sebesar \`${Intl.NumberFormat('id', {
                style: 'currency',
                currency: 'IDR',
            }).format(data.gross_amount)}\` telah dikembalikan.`;
            break;
        case 'partial_refund':
            content = `Dana dari transaksi ${
                data.order_id
            } sebesar \`${Intl.NumberFormat('id', {
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
                content = `Transaksi ${
                    data.order_id
                } sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(
                    data.gross_amount
                )}\` ditolak karena diragukan kebenarannya.`;
            } else {
                content = `Transaksi ${
                    data.order_id
                } sebesar \`${Intl.NumberFormat('id', {
                    style: 'currency',
                    currency: 'IDR',
                }).format(data.gross_amount)}\` ditolak.`;
            }
            break;
        case 'cancel':
            content = `Transaksi ${data.order_id} sebesar \`${Intl.NumberFormat(
                'id',
                {
                    style: 'currency',
                    currency: 'IDR',
                }
            ).format(data.gross_amount)}\` dibatalkan.`;
            break;
        default:
            break;
    }

    // notif discord
    axios.post(process.env.DISCORD_MIDTRANS_BOT, { content: content });
}

function midtransPaymentNotificationReceiver(req, res) {
    // konfirmasi kembali
    let data = {};
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
                Pembayaran.findById(data.order_id).then((pembayaran) => {
                    if (pembayaran) {
                        if (
                            pembayaran.paymentDetails.hasOwnProperty(
                                'transaction_id'
                            ) &&
                            pembayaran.paymentDetails.transaction_id ===
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
                                    delete data.transactionToken;
                                    delete data.link;
                                }
                                pembayaran.paymentDetails.transaction_status =
                                    data.transaction_status;
                                pembayaran.paymentDetails.fraud_status =
                                    data.fraud_status;
                            }
                        } else {
                            pembayaran.paymentDetails.transaction_id =
                                data.transaction_id;
                            pembayaran.paymentDetails.payment_type =
                                data.payment_type;
                            pembayaran.paymentDetails.transaction_status =
                                data.transaction_status;
                            pembayaran.paymentDetails.transaction_time =
                                data.transaction_time;
                            pembayaran.paymentDetails.merchant_id =
                                data.merchant_id;
                            pembayaran.paymentDetails.fraud_status =
                                data.fraud_status;
                            pembayaran.paymentDetails.link = {
                                instruksi: `https =//app.sandbox.midtrans.com/snap/v1/transactions/${pembayaran.transactionToken}/pdf`,
                            };
                        }
                        pembayaran.save((err) => {
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
                    }
                });
            }
        })
        .catch((err) => {
            return res.status(500).json({
                status: 'failed',
            });
        });
}

module.exports = {
    buy,
    getStruct,
    midtransPaymentNotificationReceiver,
};

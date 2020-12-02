const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new Schema(
    {
        userID: {
            type: mongoose.Types.ObjectId,
            required: true,
            ref: 'users',
        },
        paid: {
            type: Boolean,
            default: false,
        },
        paymentDetails: {
            type: Object,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: true,
        },
        struct: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true }
);

module.exports = Pembayaran = mongoose.model('payments', PaymentSchema);

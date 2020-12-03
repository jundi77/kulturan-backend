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
        itemDetails: [
            {
                type: mongoose.Types.ObjectId,
                required: true,
                ref: 'videos',
            },
        ],
        paymentDetails: {
            type: Object,
            default: {},
        },
        totalPrice: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = Pembayaran = mongoose.model('payments', PaymentSchema);

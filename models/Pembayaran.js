const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const generatePaymentId = () => {
    let now = new Date();
    console.log('nanoid: ' + global.kulturan.models.Pembayaran.nanoid());
    return `${now.getFullYear() % 100}${
        now.getMonth() + 1
    }${now.getDate()}${global.kulturan.models.Pembayaran.nanoid()}`;
};

const PaymentSchema = new Schema(
    {
        _id: {
            type: String,
            default: generatePaymentId(),
        },
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

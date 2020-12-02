const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        keranjang: [
            {
                // refer ke id video
                type: mongoose.Types.ObjectId,
                ref: 'videos',
            },
        ],
        favorit: [
            {
                // refer ke id video
                type: mongoose.Types.ObjectId,
                ref: 'videos',
            },
        ],
        pembayaran: [
            {
                // refer ke id pembayaran
                type: mongoose.Types.ObjectId,
                ref: 'payments',
            },
        ],
    },
    { timestamps: true }
);

module.exports = User = mongoose.model('users', UserSchema);

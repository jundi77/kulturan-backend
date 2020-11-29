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
        paymentHistory: [
            {
                type: new mongoose.Schema(
                    {
                        videoId: [
                            {
                                type: mongoose.Types.ObjectId,
                                required: true,
                            },
                        ],
                        paid: {
                            type: Boolean,
                            default: false,
                        },
                        paymentMethod: {
                            provider: {
                                type: String,
                                required: true,
                            },
                            // lainnya
                        },
                        amount: {
                            type: Number,
                            required: true,
                            min: 0,
                        },
                    },
                    { timestamps: true }
                ),
            },
        ],
    },
    { timestamps: true }
);

module.exports = User = mongoose.model('users', UserSchema);

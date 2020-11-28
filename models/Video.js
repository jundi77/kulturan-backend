const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VideoSchema = new Schema(
    {
        link: {
            stage: {
                type: String,
            },
            trailer: {
                type: String,
            },
            thumbnail: {
                type: String,
            },
        },
        views: {
            type: Number,
            default: 0,
            min: 0,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        pementas: {
            type: String,
            required: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        favourites: {
            type: Number,
            default: 0,
            min: 0,
        },
        tanggal: {
            pementasan: {
                type: Date,
                required: true,
            },
        },
        kategori: [
            {
                type: mongoose.Types.ObjectId,
            },
        ],
    },
    { timestamps: true }
);

module.exports = Video = mongoose.model('videos', VideoSchema);

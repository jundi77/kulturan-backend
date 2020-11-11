const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        name: {
            /**
             * Tidak perlu required, kemungkinan besar yang perlu
             * name hanya publisher, bukan viewer.
             */
            type: String,
        },
        email: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = User = mongoose.model('users', UserSchema);

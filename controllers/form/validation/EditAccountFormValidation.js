const isEmpty = require('is-empty');
const Validator = require('validator');

function validateUserData(data) {
    let errors = {};
    let empty = true;

    if (data.hasOwnProperty('name')) {
        empty = false;
        if (isEmpty(data.name)) {
            errors.name = 'Name tidak boleh kosong';
        } else if (!Validator.isAlpha(data.name)) {
            errors.name = 'Name harus huruf';
        }
    }

    if (data.hasOwnProperty('email')) {
        empty = false;
        if (isEmpty(data.email)) {
            errors.email = 'Email tidak boleh kosong';
        } else if (!Validator.isEmail(data.email)) {
            errors.email = 'Email tidak valid';
        }
    }

    if (data.hasOwnProperty('newPassword')) {
        empty = false;
        if (isEmpty(data.newPassword)) {
            errors.newPassword = 'Password baru tidak boleh kosong';
        } else if (!Validator.isLength(data.password, { min: 6, max: 16 })) {
            errors.newPassword = 'Panjang password 6-16 karakter';
        }

        if (isEmpty(data.password)) {
            errors.password = 'Password tidak boleh kosong';
        } else if (!Validator.isLength(data.password, { min: 6, max: 16 })) {
            errors.password = 'Panjang password 6-16 karakter';
        }
    }

    return {
        errors,
        empty,
        isValid: isEmpty(errors),
    };
}

module.exports = validateUserData;

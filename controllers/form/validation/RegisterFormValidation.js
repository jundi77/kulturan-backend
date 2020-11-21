const isEmpty = require('is-empty');
const Validator = require('validator');

function validateRegisterInput(data) {
    let errors = {};

    if (isEmpty(data.name)) {
        errors.name = 'Name tidak boleh kosong';
    } else {
        const valid = (input) =>
            input.split(' ').every(function (str) {
                return Validator.isAlpha(str);
            });
        if (!valid(data.name)) {
            errors.name = 'Name harus huruf';
        }
    }

    if (isEmpty(data.email)) {
        errors.email = 'Email tidak boleh kosong';
    } else if (!Validator.isEmail(data.email)) {
        errors.email = 'Email tidak valid';
    }

    if (isEmpty(data.password)) {
        errors.password = 'Password tidak boleh kosong';
    } else if (!Validator.isLength(data.password, { min: 6, max: 16 })) {
        errors.password = 'Panjang password 6-16 karakter';
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
}

module.exports = validateRegisterInput;

const isEmpty = require('is-empty');
const Validator = require('validator');

function validateLoginInput(data) {
    let errors = {};

    // convert kekosongan menjadi '', menghindari kata undefined
    data = {
        email: isEmpty(data.email) ? '' : data.email,
        password: isEmpty(data.password) ? '' : data.password,
    };

    if (isEmpty(data.email)) {
        errors.email = 'Email is required';
    }

    if (isEmpty(data.password)) {
        errors.password = 'Password is required';
    }

    if (!Validator.isEmail(data.email)) {
        errors.email = 'Email is invalid';
    }

    if (!Validator.isLength(data.password, { min: 6, max: 16 })) {
        errors.password = "Password's length must between 6 and 16";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
}

module.exports = validateLoginInput;

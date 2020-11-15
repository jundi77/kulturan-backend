const isEmpty = require('is-empty');
const Validator = require('validator');

function validateRegisterInput(data) {
    let errors = {};

    // convert kekosongan menjadi '', menghindari kata undefined
    data = {
        name: isEmpty(data.name) ? '' : data.name,
        email: isEmpty(data.email) ? '' : data.email,
        password: isEmpty(data.password) ? '' : data.password,
        password_confirm: isEmpty(data.password_confirm)
            ? ''
            : data.password_confirm,
    };
    console.log(data);
    if (isEmpty(data.name)) {
        errors.name = 'Name is required';
    }

    if (isEmpty(data.email)) {
        errors.email = 'Email is required';
    }

    if (isEmpty(data.password)) {
        errors.password = 'Password is required';
    }

    if (isEmpty(data.password_confirm)) {
        errors.password_confirm = 'Password must be confirmed';
    }

    if (!Validator.isEmail(data.email)) {
        errors.email = 'Email is invalid';
    }

    if (!Validator.isLength(data.password, { min: 6, max: 16 })) {
        //bug
        errors.password = "Password's length must between 6 and 16";
    }

    if (!Validator.isLength(data.password_confirm, { min: 6, max: 16 })) {
        errors.password =
            "Password's confirmation length must between 6 and 16";
    }

    if (!Validator.equals(data.password, data.password_confirm)) {
        errors.password_confirm = "Password's confirmation is wrong";
    }

    return {
        errors,
        isValid: isEmpty(errors),
    };
}

module.exports = validateRegisterInput;

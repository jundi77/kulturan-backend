module.exports = (nanoid) => {
    return nanoid.customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 9);
};

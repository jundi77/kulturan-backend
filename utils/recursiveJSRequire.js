/**
 * Secara rekursif, require semua file .js
 * yang ada di direktori dan
 * subdirektorinya.
 *
 * modified from https://stackoverflow.com/questions/5364928/node-js-require-all-files-in-a-folder
 */
module.exports = (...dirs) => {
    const glob = require('glob');
    const path = require('path');
    let contains = {};

    dirs.forEach((dir) => {
        glob.sync(`./${dir}/**/`).forEach(function (subdir) {
            glob.sync(`./${subdir}/*.js`).forEach(function (file) {
                Object.assign(contains, require(path.resolve(file)));
            });
        });
    });

    return contains;
};

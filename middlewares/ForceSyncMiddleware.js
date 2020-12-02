function checkWhom(req, res, next) {
    if (process.env('FORCE_SYNC_KEY') === req.headers.authorization) {
        // sha512 check
    }
}

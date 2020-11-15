const jwt = require('jsonwebtoken');
const { ExtractJwt } = require('passport-jwt');

function auth(req, res, next) {
    const token = req.body.access_token;
    const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
    console.log(jwtFromRequest);
    if (!token) {
        res.status(401).json({ status: 'failed', token: 'Token is required' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.secretOrKey);
        const { id, name, email } = decoded;
        req.user = { id, name, email };
        // further checking is required (cek model kalau ada user terkait)
        console.log(id, email);
        res.status(200).json({ status: 'success', data: { id, name, email } });
        next();
    } catch (error) {
        res.status(400).json({ status: 'failed', token: 'Invalid token' });
    }
}

module.exports = auth;

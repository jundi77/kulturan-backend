const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.body['authentication'] || req.body['x-auth-token'];

    if (!token) {
        res.status(401).json({ token: 'Token is required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.secretOrKey);
        const { id, email } = decoded;
        req.user = { id, email };
        // further checking is required (cek model kalau ada user terkait)
        console.log(id, email);
        res.status(200).json({ id, email });
        next();
    } catch (error) {
        res.status(400).json({ token: 'Invalid token' });
    }
}

module.exports = auth;

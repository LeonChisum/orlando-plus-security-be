const jwt = require('jsonwebtoken');

function auth(req, res, next) {
	const token = req.header('authorization');

	//check for token
	if (!token) return res.status(401).json({ message: 'authorization denied' });

	try {
		//verify token
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		req.user = decoded;
		next();
	} catch (error) {
		res.status(400).json({ message: 'could not authorize token' });
	}
}

module.exports = auth;

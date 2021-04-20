require('dotenv').config();
const express = require('express');
const server = express();
const cors = require('cors');
const mongoose = require('mongoose');

mongoose.connect(process.env.DB_URL, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true,
});
const db = mongoose.connection;
db.on('error', (error) => console.error(error));
db.once('open', () => console.log('connected to database'));

server.use(express.json());
server.use(cors());

//Routes
server.use('/auth', require('./auth/authentication'));
server.use('/guards', require('./routes/guardsRouter'));
server.use('/shows', require('./routes/showRouter'));

module.exports = server;

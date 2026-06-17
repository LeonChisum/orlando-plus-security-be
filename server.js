require('dotenv').config();
const express = require('express');
const server = express();
const cors = require('cors');

server.use(express.json());
server.use(cors());

//Routes
server.use('/auth', require('./auth/authentication'));

module.exports = server;

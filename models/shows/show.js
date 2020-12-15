const mongoose = require('mongoose');
const Post = require('./posts');

const showSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	location: {
		type: String,
		required: true,
	},
	moveIn: {
		type: String,
		required: true,
	},
	showDays: {
		type: String,
		required: true,
	},
	moveOut: {
		type: String,
		required: true,
	},
	confirmed: {
		type: Number,
	},
	pending: {
		type: Number,
	},
	postDays: [[Post]],
});

module.exports = mongoose.model('Show', showSchema);

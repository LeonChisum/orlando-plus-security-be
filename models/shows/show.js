const mongoose = require('mongoose');
const Post = require('./posts').schema;

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
		type: Date,
		required: true,
	},
	showDayStart: {
		type: Date,
		required: true,
	},
	showDayEnd: {
		type: Date,
		required: true,
	},
	moveOut: {
		type: Date,
		required: true,
	},
	confirmed: {
		type: Number,
	},
	pending: {
		type: Number,
	},
	postDays: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Post',
		},
	],
});

module.exports = mongoose.model('Show', showSchema);

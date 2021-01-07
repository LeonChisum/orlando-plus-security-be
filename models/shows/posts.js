const mongoose = require('mongoose');
const Guard = require('../employee_guard');

const postSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	location: {
		type: String,
		required: true,
	},
	shifts: [
		{
			hourStart: {
				type: Number,
				required: true,
			},
			hourEnd: {
				type: Number,
				required: true,
			},
			staff: {
				guard: {},
			},
			confirmed: Boolean,
		},
	],
	date: {
		type: Date,
		default: Date.now,
		required: true,
	},
	notes: [
		{
			message: String,
		},
	],
});

module.exports = mongoose.model('Post', postSchema);

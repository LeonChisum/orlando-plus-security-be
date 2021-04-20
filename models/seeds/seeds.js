const faker = require('faker');
const Guard = require('../employee_guard');

// @creates Fake data to seed Guard collection
// const guards = await seedGuards(50);

// Guard.insertMany(guards, (err, docs) => {
//     if(err) return console.log(err)
//     res.status(200).json({ guardsAdded: docs})
// })
// @ ^ Insert into Route to populate ^

const seedGuards = (num) => {
	const fakeGuard = () => ({
		firstName: faker.name.firstName(),
		lastName: faker.name.lastName(),
		email: faker.internet.email(),
		address: {
			street: faker.address.streetName(),
			city: faker.address.city(),
			state: 'FL',
		},
		phone: {
			cell: faker.phone.phoneNumber(3),
			home: faker.phone.phoneNumber(3),
		},
		ssn: faker.random.number({ min: 000000000, max: 999999999 }),
		birthDate: faker.date.between('1940-05-18', '2000-08-25'),
		startDate: faker.date.past(1, '2020-01-13'),
		dLicense: {
			blueCard: faker.random.boolean(),
			number: faker.random.uuid(),
			exp: faker.date.future(1),
		},
		gLicense: {
			activeLicense: faker.random.boolean(),
			number: faker.random.uuid(),
			exp: faker.date.future(1),
		},
		ccw: {
			activeLicense: faker.random.boolean(),
			number: faker.random.uuid(),
			exp: faker.date.future(1),
		},
		uniform: {
			polo: {
				hasIssued: faker.random.boolean(),
				size: 'L',
				qty: faker.random.number(4),
			},
			jacket: {
				hasIssued: faker.random.boolean(),
				size: '48R',
			},
		},
		badge: {
			hasIssued: faker.random.boolean(),
			barcode: faker.random.uuid(),
		},
		position: 'guard',
		rating: 'A',
		shiftPref: {
			startTime: faker.random.number({ min: 0000, max: 2400 }),
			endTime: faker.random.number({ min: 0000, max: 2400 }),
		},
		transportation: 'car',
		emergencyContact: {
			name: faker.random.name(),
			phone: faker.phone.phoneNumber(3),
			relation: faker.name.title(),
		},
	});

	const guardsArr = [];

	for (let i = 0; i < num; i++) {
		guardsArr.push(fakeGuard());
	}

	return guardsArr;
};

// @creates Fake data to seed Show collection
// const shows = await seedShows(50);

// Show.insertMany(shows, (err, docs) => {
//     if(err) return console.log(err)
//     res.status(200).json({ showsAdded: docs})
// })
// @ ^ Insert into Route to populate ^

const seedShows = (num) => {
	const fakeShow = () => ({
		name: faker.name.title(),
		location: faker.hacker.abbreviation(),
		moveIn: faker.date.past(1, '2020-01-13'),
		showDayStart: faker.date.past(1, '2020-01-13'),
		showDayEnd: faker.date.past(1, '2020-01-13'),
		moveOut: faker.date.past(1, '2020-01-23'),
		confirmed: faker.random.number({ min: 00, max: 80 }),
		pending: faker.random.number({ min: 00, max: 80 }),
		postDays: [],
	});

	const showsArr = [];

	for (let i = 0; i < num; i++) {
		showsArr.push(fakeShow());
	}

	return showsArr;
};

// @creates Fake data to seed Post collection
// const posts = await seedPosts(50);

// Post.insertMany(Posts, (err, docs) => {
//     if(err) return console.log(err)
//     res.status(200).json({ PostsAdded: docs})
// })
// @ ^ Insert into Route to populate ^

// const seedPosts = (num) => {
// 	const fakePost = () => ({
// 		name: faker.name.title(),
// 		location: faker.hacker.abbreviation(),
// 		moveIn: faker.date.past(1, '2020-01-13'),
// 		PostDays: faker.date.past(1, '2020-01-13'),
// 		moveOut: faker.date.past(1, '2020-01-23'),
// 		confirmed: faker.random.number({ min: 00, max: 80 }),
// 		pending: faker.random.number({ min: 00, max: 80 }),
// 		postDays: [],
// 	});

// 	const PostsArr = [];

// 	for (let i = 0; i < num; i++) {
// 		PostsArr.push(fakePost());
// 	}

// 	return PostsArr;
// };

module.exports = {
	seedGuards,
	seedShows,
};

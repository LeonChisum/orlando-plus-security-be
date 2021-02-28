import axios from 'axios';

// For authenication for protected actions
export const axiosWithAuth = () => {
	const token = localStorage.getItem('token');

	return axios.create({
		baseURL: 'http://localhost:5000/',
		headers: {
			Authorization: token ? `${token}` : '',
		},
	});
};

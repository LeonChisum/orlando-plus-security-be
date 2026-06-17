import axios from 'axios'

// Vite proxy forwards /auth, /guards, /shows to Express on port 5000
export const axiosWithAuth = () => {
  const token = localStorage.getItem('token')
  return axios.create({
    headers: {
      Authorization: token ?? '',
    },
  })
}

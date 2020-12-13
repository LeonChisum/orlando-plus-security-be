import axios from "axios"

// For authenication for protected actions
export const axiosWithAuth = () => {
    const token = localStorage.getItem('token')

    return axios.create({
        baseURL: process.env.DB_URL,
        headers: {
            "Authorization": token ? `x-access-token: ${token}` : ''
        }
    })
}
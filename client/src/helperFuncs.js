import axios from "axios"

export const axiosWithAuth = () => {
    const token = localStorage.getItem('token')

    return axios.create({
        baseURL: process.env.DB_URL,
        headers: {
            "Authorization": token ? `Bearer ${token}` : ''
        }
    })
}
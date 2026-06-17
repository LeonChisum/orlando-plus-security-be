import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({ baseURL: 'http://localhost:5000/' })

api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = session.access_token
  }
  return config
})

export const axiosWithAuth = () => api

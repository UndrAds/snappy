import axios from 'axios'
import type {
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
  User,
  ApiResponse,
} from '@snappy/shared-types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: async (
    data: CreateUserRequest
  ): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/api/auth/register', data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/api/auth/login', data)
    return response.data
  },
}

// User API
export const userAPI = {
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.get('/api/users/profile')
    return response.data
  },

  updateProfile: async (
    data: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> => {
    const response = await api.put('/api/users/profile', data)
    return response.data
  },
}

// Health check
export const healthAPI = {
  check: async (): Promise<
    ApiResponse<{ status: string; timestamp: string; uptime: number }>
  > => {
    const response = await api.get('/health')
    return response.data
  },
}

export default api

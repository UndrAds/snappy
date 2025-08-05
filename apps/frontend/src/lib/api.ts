import axios from 'axios'
import type {
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
  User,
  ApiResponse,
  Story,
  CreateStoryRequest,
  UpdateStoryRequest,
  StoryFrame,
  CreateStoryFrameRequest,
  UpdateStoryFrameRequest,
  StoryElement,
  CreateStoryElementRequest,
  UpdateStoryElementRequest,
  StoryBackground,
  CreateStoryBackgroundRequest,
} from '@snappy/shared-types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

// Story API
export const storyAPI = {
  // Create a new story
  createStory: async (
    data: CreateStoryRequest
  ): Promise<ApiResponse<Story>> => {
    const response = await api.post('/api/stories', data)
    return response.data
  },

  // Get all stories for the current user
  getUserStories: async (): Promise<ApiResponse<Story[]>> => {
    const response = await api.get('/api/stories')
    return response.data
  },

  // Get story by ID
  getStoryById: async (id: string): Promise<ApiResponse<Story>> => {
    const response = await api.get(`/api/stories/${id}`)
    return response.data
  },

  // Get story by unique ID (public access)
  getStoryByUniqueId: async (uniqueId: string): Promise<ApiResponse<Story>> => {
    const response = await api.get(`/api/stories/public/${uniqueId}`)
    return response.data
  },

  // Update story
  updateStory: async (
    id: string,
    data: UpdateStoryRequest
  ): Promise<ApiResponse<Story>> => {
    const response = await api.put(`/api/stories/${id}`, data)
    return response.data
  },

  // Delete story
  deleteStory: async (
    id: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/stories/${id}`)
    return response.data
  },

  // Save complete story from editor
  saveCompleteStory: async (storyData: any): Promise<ApiResponse<Story>> => {
    const response = await api.post('/api/stories/save-complete', storyData)
    return response.data
  },

  // Story frame operations
  createStoryFrame: async (
    storyId: string,
    data: CreateStoryFrameRequest
  ): Promise<ApiResponse<StoryFrame>> => {
    const response = await api.post(`/api/stories/${storyId}/frames`, data)
    return response.data
  },

  updateStoryFrame: async (
    frameId: string,
    data: UpdateStoryFrameRequest
  ): Promise<ApiResponse<StoryFrame>> => {
    const response = await api.put(`/api/stories/frames/${frameId}`, data)
    return response.data
  },

  deleteStoryFrame: async (
    frameId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/stories/frames/${frameId}`)
    return response.data
  },

  // Story element operations
  createStoryElement: async (
    frameId: string,
    data: CreateStoryElementRequest
  ): Promise<ApiResponse<StoryElement>> => {
    const response = await api.post(
      `/api/stories/frames/${frameId}/elements`,
      data
    )
    return response.data
  },

  updateStoryElement: async (
    elementId: string,
    data: UpdateStoryElementRequest
  ): Promise<ApiResponse<StoryElement>> => {
    const response = await api.put(`/api/stories/elements/${elementId}`, data)
    return response.data
  },

  deleteStoryElement: async (
    elementId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/stories/elements/${elementId}`)
    return response.data
  },

  // Story background operations
  upsertStoryBackground: async (
    frameId: string,
    data: CreateStoryBackgroundRequest
  ): Promise<ApiResponse<StoryBackground>> => {
    const response = await api.post(
      `/api/stories/frames/${frameId}/background`,
      data
    )
    return response.data
  },

  deleteStoryBackground: async (
    frameId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(
      `/api/stories/frames/${frameId}/background`
    )
    return response.data
  },
}

// Upload API
export const uploadAPI = {
  // Upload single file
  uploadSingle: async (
    file: File
  ): Promise<
    ApiResponse<{
      filename: string
      originalName: string
      size: number
      url: string
    }>
  > => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post('/api/uploads/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Upload multiple files
  uploadMultiple: async (
    files: File[]
  ): Promise<
    ApiResponse<
      Array<{
        filename: string
        originalName: string
        size: number
        url: string
      }>
    >
  > => {
    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file)
    })

    const response = await api.post('/api/uploads/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
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

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

// Use relative URLs in both development and production
// In development, Vite proxy handles the routing
// In production, nginx handles the routing
const API_BASE_URL = import.meta.env.VITE_API_URL || ''

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
      const url: string = error.config?.url || ''
      const isAuthEndpoint =
        url.includes('/api/auth/login') || url.includes('/api/auth/register')

      // Do not force redirect on auth endpoints so forms/toasts can handle errors
      if (!isAuthEndpoint) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
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

  // Export story to Google H5 Ads
  getExportInfo: async (
    storyId: string,
    exportType: 'standard' | 'app-campaigns' = 'standard'
  ): Promise<
    ApiResponse<{
      storyFrames: number
      imageCount: number
      estimatedFiles: number
      maxSize: number
      maxFiles: number
      constraints: {
        fileSize: { limit: number; limitKB: number }
        fileCount: { limit: number; estimated: number }
      }
    }>
  > => {
    const response = await api.get(`/api/stories/${storyId}/export/info`, {
      params: { exportType },
    })
    return response.data
  },

  exportToH5Ads: async (
    storyId: string,
    exportType: 'standard' | 'app-campaigns' = 'standard'
  ): Promise<void> => {
    const response = await api.get(`/api/stories/${storyId}/export/h5`, {
      params: { exportType },
      responseType: 'blob',
    })
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `story-h5-${storyId}.zip`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
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

// RSS API
export const rssAPI = {
  // Validate RSS feed URL
  validateFeedUrl: async (
    feedUrl: string
  ): Promise<ApiResponse<{ isValid: boolean }>> => {
    const response = await api.post('/api/rss/validate-feed', { feedUrl })
    return response.data
  },

  // Get RSS processing status
  getProcessingStatus: async (storyId: string): Promise<ApiResponse<any>> => {
    const response = await api.get(`/api/rss/processing-status/${storyId}`)
    return response.data
  },

  // Update RSS configuration
  updateRSSConfig: async (
    storyId: string,
    rssConfig: any
  ): Promise<ApiResponse<Story>> => {
    const response = await api.put(`/api/rss/config/${storyId}`, { rssConfig })
    return response.data
  },

  // Toggle RSS updates
  toggleRSSUpdates: async (
    storyId: string,
    isActive: boolean
  ): Promise<ApiResponse<Story>> => {
    const response = await api.put(`/api/rss/toggle/${storyId}`, { isActive })
    return response.data
  },

  // Trigger manual RSS update
  triggerRSSUpdate: async (
    storyId: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(`/api/rss/trigger-update/${storyId}`)
    return response.data
  },

  // Get queue statistics
  getQueueStats: async (): Promise<ApiResponse<any>> => {
    const response = await api.get('/api/rss/queue-stats')
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

// Content API
export const contentAPI = {
  // Scrape content from a website
  scrapeWebsite: async (
    url: string
  ): Promise<
    ApiResponse<{
      headlines: string[]
      images: Array<{
        url: string
        alt: string
        width?: number
        height?: number
      }>
      title: string
      description?: string
    }>
  > => {
    const response = await api.post('/api/content/scrape', { url })
    return response.data
  },
}

// Analytics API
export interface StoryAnalytics {
  storyId: string
  views: number
  avgPostsSeen: number
  avgTimeSpent: number
  avgAdsSeen: number
  impressions: number
  clicks: number // Total clicks (navigation clicks + CTA clicks)
  ctr: number // Click-through rate for CTA clicks (percentage)
  viewability: number // Viewability percentage (frames viewed / total frames)
}

export interface AnalyticsEvent {
  id: string
  eventType: string
  frameIndex: number | null
  value: number | null
  sessionId: string | null
  metadata: any
  createdAt: string
}

export const analyticsAPI = {
  // Get analytics for all user's stories
  getUserStoriesAnalytics: async (): Promise<ApiResponse<StoryAnalytics[]>> => {
    const response = await api.get('/api/analytics')
    return response.data
  },

  // Get analytics for a specific story
  getStoryAnalytics: async (
    storyId: string
  ): Promise<ApiResponse<StoryAnalytics>> => {
    const response = await api.get(`/api/analytics/${storyId}`)
    return response.data
  },

  // Get detailed analytics events for a story
  getStoryAnalyticsEvents: async (
    storyId: string,
    limit?: number,
    offset?: number
  ): Promise<
    ApiResponse<{
      events: AnalyticsEvent[]
      total: number
    }>
  > => {
    const params = new URLSearchParams()
    if (limit) params.append('limit', limit.toString())
    if (offset) params.append('offset', offset.toString())
    const queryString = params.toString()
    const url = `/api/analytics/${storyId}/events${queryString ? `?${queryString}` : ''}`
    const response = await api.get(url)
    return response.data
  },

  // Get day-wise analytics for a story
  getStoryDayWiseAnalytics: async (
    storyId: string,
    days?: number,
    startDate?: string,
    endDate?: string
  ): Promise<
    ApiResponse<
      Array<{
        date: string
        views: number
        impressions: number
        avgPostsSeen: number
        avgTimeSpent: number
        avgAdsSeen: number
        sessions: number
        ctaClicks?: number
        ctr?: number
      }>
    >
  > => {
    const params = new URLSearchParams()
    if (startDate && endDate) {
      params.append('startDate', startDate)
      params.append('endDate', endDate)
    } else if (days) {
      params.append('days', days.toString())
    }
    const queryString = params.toString()
    const url = `/api/analytics/${storyId}/daywise${queryString ? `?${queryString}` : ''}`
    const response = await api.get(url)
    return response.data
  },
}

// Admin API
export const adminAPI = {
  // Get admin dashboard stats
  getStats: async (): Promise<
    ApiResponse<{
      totalUsers: number
      totalPublishers: number
      totalStories: number
      totalViews: number
      totalImpressions: number
    }>
  > => {
    const response = await api.get('/api/admin/stats')
    return response.data
  },

  // Get advertisers for story assignment (searchable)
  getAdvertisers: async (params?: {
    search?: string
  }): Promise<
    ApiResponse<{
      advertisers: Array<{
        id: string
        email: string
        name: string | null
        displayText: string
      }>
    }>
  > => {
    const response = await api.get('/api/admin/advertisers', { params })
    return response.data
  },

  // Get all users with pagination and filters
  getUsers: async (params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
  }): Promise<
    ApiResponse<{
      users: Array<{
        id: string
        email: string
        name: string | null
        role: string
        storyCount: number
        createdAt: string
        updatedAt: string
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>
  > => {
    const response = await api.get('/api/admin/users', { params })
    return response.data
  },

  // Get all stories with pagination and filters
  getAllStories: async (params?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    userId?: string
    status?: string
    search?: string
  }): Promise<
    ApiResponse<{
      stories: Array<
        Story & { user: { id: string; email: string; name: string | null } }
      >
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>
  > => {
    const response = await api.get('/api/admin/stories', { params })
    return response.data
  },

  // Get analytics for all stories
  getAllStoriesAnalytics: async (): Promise<
    ApiResponse<
      Array<{
        storyId: string
        storyTitle: string
        userId: string
        user: { id: string; email: string; name: string | null }
        views: number
        avgPostsSeen: number
        avgTimeSpent: number
        avgAdsSeen: number
        impressions: number
      }>
    >
  > => {
    const response = await api.get('/api/admin/stories/analytics')
    return response.data
  },

  // Update any story (admin)
  updateStory: async (
    id: string,
    data: UpdateStoryRequest
  ): Promise<ApiResponse<Story>> => {
    const response = await api.put(`/api/admin/stories/${id}`, data)
    return response.data
  },

  // Delete any story (admin)
  deleteStory: async (
    id: string
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.delete(`/api/admin/stories/${id}`)
    return response.data
  },

  // Get user by ID
  getUserById: async (
    userId: string
  ): Promise<
    ApiResponse<{
      user: {
        id: string
        email: string
        name: string | null
        displayText: string
      }
    }>
  > => {
    const response = await api.get(`/api/admin/users/${userId}`)
    return response.data
  },

  // Get analytics for a specific user
  getUserAnalytics: async (
    userId: string
  ): Promise<
    ApiResponse<{
      user: { id: string; email: string; name: string | null; role: string }
      analytics: Array<{
        storyId: string
        storyTitle: string
        views: number
        avgPostsSeen: number
        avgTimeSpent: number
        avgAdsSeen: number
        impressions: number
        clicks: number
        ctr: number
        viewability: number
      }>
    }>
  > => {
    const response = await api.get(`/api/admin/users/${userId}/analytics`)
    return response.data
  },
}

export default api

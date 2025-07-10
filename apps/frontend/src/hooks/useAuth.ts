import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authAPI, userAPI } from '@/lib/api'
import type {
  User,
  CreateUserRequest,
  LoginRequest,
} from '@snappy/shared-types'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (data: LoginRequest) => Promise<void>
  register: (data: CreateUserRequest) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, token } = response.data
        setUser(user)
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authAPI.register,
    onSuccess: (response) => {
      if (response.success && response.data) {
        const { user, token } = response.data
        setUser(user)
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    },
  })

  // Get user profile query
  useQuery({
    queryKey: ['user', 'profile'],
    queryFn: userAPI.getProfile,
    enabled: !!user,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: (response) => {
      if (response.success && response.data) {
        setUser(response.data.user)
        localStorage.setItem('user', JSON.stringify(response.data.user))
        queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    },
  })

  const login = async (data: LoginRequest): Promise<void> => {
    await loginMutation.mutateAsync(data)
  }

  const register = async (data: CreateUserRequest): Promise<void> => {
    await registerMutation.mutateAsync(data)
  }

  const logout = (): void => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    queryClient.clear()
  }

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    await updateProfileMutation.mutateAsync(data)
  }

  return {
    user,
    isLoading:
      isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
  }
}

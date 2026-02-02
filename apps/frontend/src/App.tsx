import { Routes, Route, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import DashboardLayout from '@/components/DashboardLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardHomePage from '@/pages/DashboardHomePage'
import CreateSnapPage from '@/pages/CreateSnapPage'
import EditStoryPage from '@/pages/EditStoryPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import StoryAnalyticsPage from '@/pages/StoryAnalyticsPage'
import AdminDashboardPage from '@/pages/AdminDashboardPage'
import UserAnalyticsPage from '@/pages/UserAnalyticsPage'
import EditorPage from '@/pages/editor/EditorPage'
import PreviewPage from '@/pages/editor/PreviewPage'
import TestEmbedPage from '@/pages/editor/TestEmbedPage'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { toast } from 'sonner'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('You must log in to continue.')
    }
  }, [user, isLoading])
  if (isLoading) return null
  if (!user) return <LoginPage />
  return <>{children}</>
}

function DashboardIndexRoute() {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (!isLoading && user?.role === 'admin') {
      navigate('/admin', { replace: true })
    }
  }, [user, isLoading, navigate])
  if (isLoading) return null
  if (user?.role === 'admin') return null
  return <DashboardHomePage />
}

function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        toast.error('You must log in to continue.')
        navigate('/login', { replace: true })
      } else if (user.role !== 'admin') {
        toast.error('Admin access required.')
        navigate('/', { replace: true })
      }
    }
  }, [user, isLoading, navigate])

  if (isLoading) return null
  if (!user || user.role !== 'admin') return null
  return <>{children}</>
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="snappy-theme">
      <div className="min-h-screen bg-background">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <DashboardIndexRoute />
              }
            />
            <Route path="create" element={<CreateSnapPage />} />
            <Route path="edit/:uniqueId" element={<EditStoryPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="analytics/:storyId" element={<StoryAnalyticsPage />} />
            <Route
              path="admin"
              element={
                <AdminProtectedRoute>
                  <AdminDashboardPage />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="admin/user/:userId/analytics"
              element={
                <AdminProtectedRoute>
                  <UserAnalyticsPage />
                </AdminProtectedRoute>
              }
            />
          </Route>
          <Route path="editor" element={<EditorPage />} />
          <Route path="editor/:uniqueId" element={<EditorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/editor/preview" element={<PreviewPage />} />
          <Route path="/test-embed" element={<TestEmbedPage />} />
        </Routes>
        <Toaster position="top-right" closeButton offset={64} />
      </div>
    </ThemeProvider>
  )
}

export default App

import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import DashboardLayout from '@/components/DashboardLayout'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardHomePage from '@/pages/DashboardHomePage'
import CreateSnapPage from '@/pages/CreateSnapPage'
import EditStoryPage from '@/pages/EditStoryPage'
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
            <Route index element={<DashboardHomePage />} />
            <Route path="create" element={<CreateSnapPage />} />
            <Route path="edit/:uniqueId" element={<EditStoryPage />} />
          </Route>
          <Route path="editor" element={<EditorPage />} />
          <Route path="editor/:uniqueId" element={<EditorPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/editor/preview" element={<PreviewPage />} />
          <Route path="/test-embed" element={<TestEmbedPage />} />
        </Routes>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App

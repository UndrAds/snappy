import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from '@/components/Layout'
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import DashboardPage from '@/pages/DashboardPage'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="snappy-theme">
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
        <Toaster />
      </div>
    </ThemeProvider>
  )
}

export default App

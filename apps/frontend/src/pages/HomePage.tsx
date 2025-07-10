import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Zap, Shield, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Welcome to{' '}
          <span className="text-primary">Snappy</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A modern, fast, and secure web application built with cutting-edge technologies.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/register">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Features</h2>
          <p className="text-muted-foreground mt-2">
            Built with modern technologies for the best developer and user experience.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary" />
              <CardTitle>Lightning Fast</CardTitle>
              <CardDescription>
                Built with Vite and SWC for instant hot reloads and fast builds.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary" />
              <CardTitle>Secure</CardTitle>
              <CardDescription>
                JWT authentication, rate limiting, and secure API endpoints.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-primary" />
              <CardTitle>User Friendly</CardTitle>
              <CardDescription>
                Beautiful UI with shadcn/ui components and Tailwind CSS.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Technology Stack</h2>
          <p className="text-muted-foreground mt-2">
            Modern tools and frameworks for building scalable applications.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Frontend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>React 18</span>
                <span className="text-muted-foreground">UI Framework</span>
              </div>
              <div className="flex justify-between">
                <span>Vite</span>
                <span className="text-muted-foreground">Build Tool</span>
              </div>
              <div className="flex justify-between">
                <span>TypeScript</span>
                <span className="text-muted-foreground">Language</span>
              </div>
              <div className="flex justify-between">
                <span>Tailwind CSS v4</span>
                <span className="text-muted-foreground">Styling</span>
              </div>
              <div className="flex justify-between">
                <span>shadcn/ui</span>
                <span className="text-muted-foreground">Components</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Backend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Node.js</span>
                <span className="text-muted-foreground">Runtime</span>
              </div>
              <div className="flex justify-between">
                <span>Express.js</span>
                <span className="text-muted-foreground">Framework</span>
              </div>
              <div className="flex justify-between">
                <span>TypeScript</span>
                <span className="text-muted-foreground">Language</span>
              </div>
              <div className="flex justify-between">
                <span>PostgreSQL</span>
                <span className="text-muted-foreground">Database</span>
              </div>
              <div className="flex justify-between">
                <span>Prisma</span>
                <span className="text-muted-foreground">ORM</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
} 
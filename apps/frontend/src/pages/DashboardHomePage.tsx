import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Clock, TrendingUp, Calendar } from 'lucide-react'

export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome to Snappy</h2>
        <p className="text-muted-foreground">
          Create, manage, and analyze your web stories
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Create New Story
            </CardTitle>
            <CardDescription>
              Start building your next web story
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Story
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="mr-2 h-5 w-5" />
              View Analytics
            </CardTitle>
            <CardDescription>Check your story performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <TrendingUp className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Recent Stories
            </CardTitle>
            <CardDescription>Continue working on drafts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Calendar className="mr-2 h-4 w-4" />
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Stories</CardTitle>
            <CardDescription>Your latest published stories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <h4 className="font-medium">Breaking News Story</h4>
                  <p className="text-sm text-muted-foreground">
                    Published 2 days ago
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">3,247 views</div>
                  <div className="text-sm text-muted-foreground">
                    85% completion
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <h4 className="font-medium">Tech Update Weekly</h4>
                  <p className="text-sm text-muted-foreground">
                    Published 5 days ago
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">2,891 views</div>
                  <div className="text-sm text-muted-foreground">
                    72% completion
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <h4 className="font-medium">Lifestyle Tips</h4>
                  <p className="text-sm text-muted-foreground">
                    Published 1 week ago
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-medium">2,156 views</div>
                  <div className="text-sm text-muted-foreground">
                    68% completion
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Your story performance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Stories</span>
                <span className="text-lg font-bold">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Views</span>
                <span className="text-lg font-bold">12,847</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg. Completion</span>
                <span className="text-lg font-bold">78.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Draft Stories</span>
                <span className="text-lg font-bold">3</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Tips to help you create amazing stories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 font-medium">Create Your First Story</h4>
              <p className="text-sm text-muted-foreground">
                Start by creating a new story and adding your content
              </p>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 font-medium">Track Performance</h4>
              <p className="text-sm text-muted-foreground">
                Monitor your story views and engagement metrics
              </p>
            </div>
            <div className="p-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h4 className="mb-2 font-medium">Optimize & Improve</h4>
              <p className="text-sm text-muted-foreground">
                Use analytics to improve your future stories
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

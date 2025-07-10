import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Eye,
  Users,
  Clock,
  BarChart3,
  Calendar,
} from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">
          Track your story performance and audience engagement
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Viewers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,234</div>
            <p className="text-xs text-muted-foreground">
              +15.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. View Time
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2m 34s</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5%</div>
            <p className="text-xs text-muted-foreground">
              +5.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>
              Daily story views for the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25">
              <div className="text-center">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Chart will be implemented here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Stories */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Stories</CardTitle>
            <CardDescription>Your best performing content</CardDescription>
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
      </div>

      {/* Audience Demographics */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Demographics</CardTitle>
          <CardDescription>Understand your audience better</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h4 className="mb-4 font-medium">Age Groups</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">18-24</span>
                  <span className="text-sm font-medium">35%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">25-34</span>
                  <span className="text-sm font-medium">42%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">35-44</span>
                  <span className="text-sm font-medium">18%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">45+</span>
                  <span className="text-sm font-medium">5%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-medium">Geographic Distribution</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">United States</span>
                  <span className="text-sm font-medium">45%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">United Kingdom</span>
                  <span className="text-sm font-medium">22%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Canada</span>
                  <span className="text-sm font-medium">15%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Other</span>
                  <span className="text-sm font-medium">18%</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-medium">Device Types</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Mobile</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Desktop</span>
                  <span className="text-sm font-medium">25%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Tablet</span>
                  <span className="text-sm font-medium">7%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Picker */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span className="text-sm font-medium">Last 30 days</span>
        </div>
        <Button variant="outline">Export Data</Button>
      </div>
    </div>
  )
}

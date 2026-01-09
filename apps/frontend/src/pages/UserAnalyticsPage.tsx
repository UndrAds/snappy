import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'
import { adminAPI } from '@/lib/api'

export default function UserAnalyticsPage() {
  const navigate = useNavigate()
  const { userId } = useParams<{ userId: string }>()
  const [isLoading, setIsLoading] = useState(true)
  const [userAnalytics, setUserAnalytics] = useState<{
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
  } | null>(null)

  useEffect(() => {
    if (userId) {
      loadUserAnalytics()
    }
  }, [userId])

  const loadUserAnalytics = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      const response = await adminAPI.getUserAnalytics(userId)

      if (response.success && response.data) {
        setUserAnalytics(response.data)
      } else {
        toast.error('Failed to load user analytics')
        navigate('/admin')
      }
    } catch (error) {
      console.error('Load user analytics error:', error)
      toast.error('Failed to load user analytics')
      navigate('/admin')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!userAnalytics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No analytics data available</p>
          <Button onClick={() => navigate('/admin')} className="mt-4">
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-3xl font-bold">
            Analytics for {userAnalytics.user.email}
          </h1>
          {userAnalytics.user.name && (
            <p className="mt-1 text-muted-foreground">
              {userAnalytics.user.name}
            </p>
          )}
        </div>
      </div>

      {userAnalytics.analytics.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userAnalytics.analytics.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userAnalytics.analytics
                    .reduce((sum, a) => sum + a.views, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Impressions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userAnalytics.analytics
                    .reduce((sum, a) => sum + a.impressions, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Total Clicks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userAnalytics.analytics
                    .reduce((sum, a) => sum + (a.clicks || 0), 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Story Analytics</CardTitle>
              <CardDescription>
                Detailed analytics for all stories created by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">
                        Story Title
                      </TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Impressions</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>CTR</TableHead>
                      <TableHead>Avg Posts Seen</TableHead>
                      <TableHead>Avg Time (ms)</TableHead>
                      <TableHead>Avg Ads Seen</TableHead>
                      <TableHead>Viewability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAnalytics.analytics.map((analytics) => (
                      <TableRow key={analytics.storyId}>
                        <TableCell className="font-medium">
                          {analytics.storyTitle || 'Untitled Story'}
                        </TableCell>
                        <TableCell>
                          {analytics.views.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {analytics.impressions.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(analytics.clicks || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {analytics.ctr
                            ? `${analytics.ctr.toFixed(2)}%`
                            : '0%'}
                        </TableCell>
                        <TableCell>
                          {analytics.avgPostsSeen.toFixed(1)}
                        </TableCell>
                        <TableCell>
                          {Math.round(analytics.avgTimeSpent).toLocaleString()}
                        </TableCell>
                        <TableCell>{analytics.avgAdsSeen.toFixed(1)}</TableCell>
                        <TableCell>
                          {analytics.viewability
                            ? `${analytics.viewability.toFixed(2)}%`
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No analytics data available for this user
          </CardContent>
        </Card>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, Clock, Image, TrendingUp, BarChart3, Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { analyticsAPI, storyAPI } from '@/lib/api'
import type { StoryAnalytics } from '@/lib/api'
import { Story } from '@snappy/shared-types'

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState<StoryAnalytics[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load analytics and stories
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [analyticsResponse, storiesResponse] = await Promise.all([
        analyticsAPI.getUserStoriesAnalytics(),
        storyAPI.getUserStories(),
      ])

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data)
      }

      if (storiesResponse.success && storiesResponse.data) {
        setStories(storiesResponse.data)
      }
    } catch (error) {
      console.error('Load analytics error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  // Create a map of storyId -> Story for quick lookup
  const storyMap = new Map(stories.map((s) => [s.id, s]))

  // Calculate totals
  const totals = analytics.reduce(
    (acc, a) => ({
      views: acc.views + a.views,
      avgPostsSeen: acc.avgPostsSeen + a.avgPostsSeen,
      avgTimeSpent: acc.avgTimeSpent + a.avgTimeSpent,
      avgAdsSeen: acc.avgAdsSeen + a.avgAdsSeen,
      impressions: acc.impressions + a.impressions,
      clicks: acc.clicks + (a.clicks || 0),
    }),
    {
      views: 0,
      avgPostsSeen: 0,
      avgTimeSpent: 0,
      avgAdsSeen: 0,
      impressions: 0,
      clicks: 0,
    }
  )

  const overallAvgPostsSeen =
    analytics.length > 0 ? totals.avgPostsSeen / analytics.length : 0
  const overallAvgTimeSpent =
    analytics.length > 0 ? totals.avgTimeSpent / analytics.length : 0
  const overallAvgAdsSeen =
    analytics.length > 0 ? totals.avgAdsSeen / analytics.length : 0

  // Format time in milliseconds to readable format
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">
              Track performance and engagement metrics for your stories
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of times the Snappy player appears in the viewport</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.views}</div>
            <p className="text-xs text-muted-foreground">Across all stories</p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Posts Seen
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average number of frames viewed per story session</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallAvgPostsSeen.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Frames per view</p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Avg. Time Spent
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average time spent viewing stories per session</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(overallAvgTimeSpent)}
            </div>
            <p className="text-xs text-muted-foreground">Per story view</p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">Avg. Ads Seen</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Average number of ad frames viewed per story session</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallAvgAdsSeen.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Ads per view</p>
          </CardContent>
        </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Total Impressions
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Number of stories viewed more than 50% of frames</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.impressions}</div>
              <p className="text-xs text-muted-foreground">Story impressions</p>
            </CardContent>
          </Card>
        </div>

        {/* Stories Analytics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Story Analytics</CardTitle>
          <CardDescription>
            Click on any story row to view detailed analytics with insights, charts, and date ranges
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No analytics data available yet. Analytics will appear here once
              your stories are viewed.
            </div>
          ) : (
            <TooltipProvider>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        Story Title
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        <div className="flex items-center gap-1">
                          Views
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Number of times the Snappy player appears in the viewport</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Clicks
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      CTR
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Viewability
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Avg. Posts Seen
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Avg. Time Spent
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      <div className="flex items-center gap-1">
                        Impressions
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Number of stories viewed more than 50% of frames</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((analyticsItem) => {
                    const story = storyMap.get(analyticsItem.storyId)
                    return (
                      <tr
                        key={analyticsItem.storyId}
                        className="cursor-pointer border-b transition-colors hover:bg-accent/50"
                        onClick={() => {
                          navigate(`/analytics/${analyticsItem.storyId}`)
                        }}
                      >
                        <td className="px-4 py-3 font-medium">
                          {story?.title || 'Unknown Story'}
                        </td>
                        <td className="px-4 py-3">{analyticsItem.views}</td>
                        <td className="px-4 py-3">
                          {analyticsItem.clicks || 0}
                        </td>
                        <td className="px-4 py-3">
                          {(analyticsItem.ctr || 0).toFixed(2)}%
                        </td>
                        <td className="px-4 py-3">
                          {(analyticsItem.viewability || 0).toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          {analyticsItem.avgPostsSeen.toFixed(1)}
                        </td>
                        <td className="px-4 py-3">
                          {formatTime(analyticsItem.avgTimeSpent)}
                        </td>
                        <td className="px-4 py-3">
                          {analyticsItem.impressions}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              story?.storyType === 'dynamic'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {story?.storyType === 'dynamic'
                              ? 'Dynamic'
                              : 'Static'}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

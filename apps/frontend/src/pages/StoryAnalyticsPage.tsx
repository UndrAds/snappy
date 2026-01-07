import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useTheme } from '@/components/theme-provider'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  Eye,
  Clock,
  Image,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  Users,
  MousePointerClick,
} from 'lucide-react'
import { analyticsAPI, storyAPI } from '@/lib/api'
import type { StoryAnalytics } from '@/lib/api'
import { Story } from '@snappy/shared-types'

export default function StoryAnalyticsPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | null>(null)
  const [analytics, setAnalytics] = useState<StoryAnalytics | null>(null)
  const [dayWiseData, setDayWiseData] = useState<
    Array<{
      date: string
      views: number
      impressions: number
      avgPostsSeen: number
      avgTimeSpent: number
      avgAdsSeen: number
      sessions: number
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState(30)
  const { theme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  // Determine if dark mode is active
  useEffect(() => {
    const checkDarkMode = () => {
      if (theme === 'dark') {
        setIsDark(true)
      } else if (theme === 'light') {
        setIsDark(false)
      } else {
        // system theme
        setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches)
      }
    }

    checkDarkMode()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        setIsDark(mediaQuery.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Chart colors based on theme
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
  const textColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
  
  // Tooltip colors - explicit colors that work well in both themes
  const tooltipStyle = isDark
    ? {
        backgroundColor: '#1f2937', // dark grey card
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#f9fafb', // light text
        borderRadius: '6px',
        padding: '8px 12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
      }
    : {
        backgroundColor: '#ffffff', // white card
        border: '1px solid rgba(0, 0, 0, 0.1)',
        color: '#111827', // dark text
        borderRadius: '6px',
        padding: '8px 12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      }

  useEffect(() => {
    if (storyId) {
      loadData()
    }
  }, [storyId, selectedDays])

  const loadData = async () => {
    if (!storyId) return

    try {
      setIsLoading(true)
      const [storyResponse, analyticsResponse, dayWiseResponse] = await Promise.all([
        storyAPI.getStoryById(storyId),
        analyticsAPI.getStoryAnalytics(storyId),
        analyticsAPI.getStoryDayWiseAnalytics(storyId, selectedDays),
      ])

      if (storyResponse.success && storyResponse.data) {
        setStory(storyResponse.data)
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data)
      }

      if (dayWiseResponse.success && dayWiseResponse.data) {
        setDayWiseData(dayWiseResponse.data)
      }
    } catch (error) {
      console.error('Load analytics error:', error)
      toast.error('Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Calculate insights
  const totalViews = dayWiseData.reduce((sum, d) => sum + d.views, 0)
  const totalImpressions = dayWiseData.reduce((sum, d) => sum + d.impressions, 0)
  const avgDailyViews = dayWiseData.length > 0 ? totalViews / dayWiseData.length : 0
  const avgDailyImpressions =
    dayWiseData.length > 0 ? totalImpressions / dayWiseData.length : 0
  const peakDay = dayWiseData.reduce(
    (max, d) => (d.views > max.views ? d : max),
    dayWiseData[0] || { date: '', views: 0, impressions: 0 }
  )

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Story not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{story.title}</h1>
            <p className="text-muted-foreground">Analytics Dashboard</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedDays === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDays(7)}
          >
            7 Days
          </Button>
          <Button
            variant={selectedDays === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDays(30)}
          >
            30 Days
          </Button>
          <Button
            variant={selectedDays === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDays(90)}
          >
            90 Days
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.views || 0}</div>
            <p className="text-xs text-muted-foreground">
              {avgDailyViews.toFixed(1)} avg per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Impressions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.impressions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {avgDailyImpressions.toFixed(1)} avg per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Posts Seen</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics?.avgPostsSeen || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Frames per view</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time Spent</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(analytics?.avgTimeSpent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Per story view</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Views Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Views Over Time</CardTitle>
            <CardDescription>Daily story views</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dayWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: tooltipStyle.color, marginBottom: '4px', fontWeight: 500 }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label) => formatDate(label as string)}
                  formatter={(value: number) => [value, 'Views']}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  name="Views"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Impressions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Impressions Over Time</CardTitle>
            <CardDescription>Daily ad impressions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: tooltipStyle.color, marginBottom: '4px', fontWeight: 500 }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label) => formatDate(label as string)}
                  formatter={(value: number) => [value, 'Impressions']}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar
                  dataKey="impressions"
                  fill="hsl(var(--chart-1))"
                  name="Impressions"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Engagement Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Metrics</CardTitle>
            <CardDescription>Average posts seen and time spent</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dayWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <YAxis yAxisId="left" tick={{ fill: textColor, fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: tooltipStyle.color, marginBottom: '4px', fontWeight: 500 }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label) => formatDate(label as string)}
                  formatter={(value: number, name: string) => {
                    if (name === 'avgTimeSpent') {
                      return [formatTime(value), 'Avg Time Spent']
                    }
                    return [value.toFixed(1), 'Avg Posts Seen']
                  }}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="avgPostsSeen"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  name="Avg Posts Seen"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgTimeSpent"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  name="Avg Time Spent (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Sessions</CardTitle>
            <CardDescription>Daily unique sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayWiseData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <YAxis tick={{ fill: textColor, fontSize: 12 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: tooltipStyle.color, marginBottom: '4px', fontWeight: 500 }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label) => formatDate(label as string)}
                  formatter={(value: number) => [value, 'Sessions']}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar dataKey="sessions" fill="hsl(var(--chart-4))" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Peak Day
              </div>
              <p className="text-2xl font-bold">{peakDay.views}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(peakDay.date)} - {peakDay.views} views
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <MousePointerClick className="h-4 w-4 text-blue-600" />
                Engagement Rate
              </div>
              <p className="text-2xl font-bold">
                {analytics?.views
                  ? ((analytics.avgPostsSeen / (story.frames?.length || 1)) * 100).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                Average frames viewed per session
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Image className="h-4 w-4 text-purple-600" />
                Ad Performance
              </div>
              <p className="text-2xl font-bold">
                {analytics?.views
                  ? (analytics.impressions / analytics.views).toFixed(2)
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Impressions per view
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

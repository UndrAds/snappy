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
  Tooltip as RechartsTooltip,
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
  MousePointerClick,
  Info,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Input } from '@/components/ui/input'
import { analyticsAPI, storyAPI } from '@/lib/api'
import { Story } from '@snappy/shared-types'

export default function StoryAnalyticsPage() {
  const { storyId } = useParams<{ storyId: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | null>(null)
  const [dayWiseData, setDayWiseData] = useState<
    Array<{
      date: string
      views: number
      impressions: number
      avgPostsSeen: number
      avgTimeSpent: number
      avgAdsSeen: number
      sessions: number
      ctaClicks?: number
      ctr?: number
    }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDays, setSelectedDays] = useState<number | null>(30)
  const [dateRange, setDateRange] = useState<
    'today' | 'yesterday' | 'custom' | 'all' | null
  >(null)
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
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

  // Bar chart colors that work in both light and dark mode
  const barColors = {
    impressions: isDark ? '#3b82f6' : '#2563eb', // Blue
    sessions: isDark ? '#8b5cf6' : '#7c3aed', // Purple
  }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, selectedDays, dateRange, customStartDate, customEndDate])

  const loadData = async () => {
    if (!storyId) return

    try {
      setIsLoading(true)

      // Calculate date range based on selection
      let startDate: string | undefined
      let endDate: string | undefined
      let days: number | undefined

      if (dateRange === 'today') {
        const today = new Date()
        startDate = today.toISOString().split('T')[0]
        endDate = today.toISOString().split('T')[0]
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        startDate = yesterday.toISOString().split('T')[0]
        endDate = yesterday.toISOString().split('T')[0]
      } else if (dateRange === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate
        endDate = customEndDate
      } else if (dateRange === 'all') {
        // For "ALL", use a very large number of days (10 years) to get all data
        days = 3650
      } else if (selectedDays !== null) {
        days = selectedDays
      }

      const [storyResponse, dayWiseResponse] = await Promise.all([
        storyAPI.getStoryById(storyId),
        analyticsAPI.getStoryDayWiseAnalytics(
          storyId,
          days,
          startDate,
          endDate
        ),
      ])

      if (storyResponse.success && storyResponse.data) {
        setStory(storyResponse.data)
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

  // Calculate metrics from dayWiseData (filtered by selected date range)
  const totalViews = dayWiseData.reduce((sum, d) => sum + d.views, 0)
  const totalImpressions = dayWiseData.reduce(
    (sum, d) => sum + d.impressions,
    0
  )
  const totalSessions = dayWiseData.reduce((sum, d) => sum + d.sessions, 0)
  const totalTimeSpent = dayWiseData.reduce(
    (sum, d) => sum + d.avgTimeSpent * d.sessions,
    0
  )
  const totalPostsSeen = dayWiseData.reduce(
    (sum, d) => sum + d.avgPostsSeen * d.sessions,
    0
  )
  const totalCtaClicks = dayWiseData.reduce(
    (sum, d) => sum + (d.ctaClicks || 0),
    0
  )

  // Calculate averages
  const avgDailyViews =
    dayWiseData.length > 0 ? totalViews / dayWiseData.length : 0
  const avgDailyImpressions =
    dayWiseData.length > 0 ? totalImpressions / dayWiseData.length : 0
  const avgPostsSeen = totalSessions > 0 ? totalPostsSeen / totalSessions : 0
  const avgTimeSpent = totalSessions > 0 ? totalTimeSpent / totalSessions : 0
  // Calculate CTR from filtered data: (CTA clicks / views) * 100
  const ctr = totalViews > 0 ? (totalCtaClicks / totalViews) * 100 : 0
  const viewability =
    story?.frames?.length && story.frames.length > 0
      ? (avgPostsSeen / story.frames.length) * 100
      : 0

  // Calculate insights
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={dateRange === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDateRange('today')
              setSelectedDays(null)
            }}
          >
            Today
          </Button>
          <Button
            variant={dateRange === 'yesterday' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDateRange('yesterday')
              setSelectedDays(null)
            }}
          >
            Yesterday
          </Button>
          <Button
            variant={selectedDays === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedDays(7)
              setDateRange(null)
            }}
          >
            7 Days
          </Button>
          <Button
            variant={selectedDays === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedDays(30)
              setDateRange(null)
            }}
          >
            30 Days
          </Button>
          <Button
            variant={selectedDays === 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedDays(90)
              setDateRange(null)
            }}
          >
            90 Days
          </Button>
          <Button
            variant={dateRange === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDateRange('custom')
              setSelectedDays(null)
            }}
          >
            Custom
          </Button>
          <Button
            variant={dateRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setDateRange('all')
              setSelectedDays(null)
            }}
          >
            All
          </Button>
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 w-32"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* Insights - Moved to top */}
      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                CTR
              </div>
              <p className="text-2xl font-bold">{ctr.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">
                Click-through rate for CTA
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Image className="h-4 w-4 text-purple-600" />
                Viewability
              </div>
              <p className="text-2xl font-bold">{viewability.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                Frames viewed / total frames
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4 text-orange-600" />
                Engagement Rate
              </div>
              <p className="text-2xl font-bold">
                {story?.frames?.length && story.frames.length > 0
                  ? ((avgPostsSeen / story.frames.length) * 100).toFixed(1)
                  : 0}
                %
              </p>
              <p className="text-xs text-muted-foreground">
                Average frames viewed per session
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Ad Performance
              </div>
              <p className="text-2xl font-bold">
                {totalViews > 0
                  ? (totalImpressions / totalViews).toFixed(2)
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">
                Impressions per view
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <TooltipProvider>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Total Views
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Number of times the Snappy player appears in the viewport
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalViews}</div>
              <p className="text-xs text-muted-foreground">
                {avgDailyViews.toFixed(1)} avg per day
              </p>
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
              <div className="text-2xl font-bold">{totalImpressions}</div>
              <p className="text-xs text-muted-foreground">
                {avgDailyImpressions.toFixed(1)} avg per day
              </p>
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
                {avgPostsSeen.toFixed(1)}
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
                    <p>Average time spent viewing the story per session</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTime(avgTimeSpent)}
              </div>
              <p className="text-xs text-muted-foreground">Per story view</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">CTR</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Click-through rate: Percentage of views that resulted in
                      CTA clicks
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ctr.toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Click-through rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium">
                  Viewability
                </CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 cursor-help text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Percentage of total frames that were viewed on average
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {viewability.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Frames viewed / total
              </p>
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

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
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{
                    color: tooltipStyle.color,
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label: string) => formatDate(label)}
                  formatter={(value: number | undefined) => [
                    value ?? 0,
                    'Views',
                  ]}
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
            <CardDescription>Daily story impressions</CardDescription>
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
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{
                    color: tooltipStyle.color,
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label: string) => formatDate(label)}
                  formatter={(value: number | undefined) => [
                    value ?? 0,
                    'Impressions',
                  ]}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar
                  dataKey="impressions"
                  fill={barColors.impressions}
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
                <YAxis
                  yAxisId="left"
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: textColor, fontSize: 12 }}
                />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{
                    color: tooltipStyle.color,
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label: string) => formatDate(label)}
                  formatter={(
                    value: number | undefined,
                    name: string | undefined
                  ) => {
                    if (name === 'avgTimeSpent') {
                      return [formatTime(value ?? 0), 'Avg Time Spent']
                    }
                    return [(value ?? 0).toFixed(1), 'Avg Posts Seen']
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
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{
                    color: tooltipStyle.color,
                    marginBottom: '4px',
                    fontWeight: 500,
                  }}
                  itemStyle={{ color: tooltipStyle.color }}
                  labelFormatter={(label: string) => formatDate(label)}
                  formatter={(value: number | undefined) => [
                    value ?? 0,
                    'Sessions',
                  ]}
                />
                <Legend wrapperStyle={{ color: textColor }} />
                <Bar
                  dataKey="sessions"
                  fill={barColors.sessions}
                  name="Sessions"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Users,
  FileText,
  Eye,
  TrendingUp,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  BarChart3,
} from 'lucide-react'
import { adminAPI } from '@/lib/api'
import { Story } from '@snappy/shared-types'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPublishers: 0,
    totalStories: 0,
    totalViews: 0,
    totalImpressions: 0,
  })
  const [users, setUsers] = useState<
    Array<{
      id: string
      email: string
      name: string | null
      role: string
      storyCount: number
      createdAt: string
      updatedAt: string
    }>
  >([])
  const [stories, setStories] = useState<
    Array<Story & { user: { id: string; email: string; name: string | null } }>
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'stories'>(
    'stats'
  )

  // Pagination for users
  const [usersPage, setUsersPage] = useState(1)
  const [usersTotalPages, setUsersTotalPages] = useState(1)
  const [usersSearch, setUsersSearch] = useState('')
  const [usersSortBy, setUsersSortBy] = useState('createdAt')
  const [usersSortOrder, setUsersSortOrder] = useState<'asc' | 'desc'>('desc')

  // Pagination for stories
  const [storiesPage, setStoriesPage] = useState(1)
  const [storiesTotalPages, setStoriesTotalPages] = useState(1)
  const [storiesSearch, setStoriesSearch] = useState('')
  const [storiesSortBy, setStoriesSortBy] = useState('createdAt')
  const [storiesSortOrder, setStoriesSortOrder] = useState<'asc' | 'desc'>(
    'desc'
  )
  const [storiesFilterUserId, setStoriesFilterUserId] = useState<string>('')
  const [storiesFilterStatus, setStoriesFilterStatus] = useState<string>('')

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null)
  const [userAnalyticsDialogOpen, setUserAnalyticsDialogOpen] = useState(false)
  const [selectedUserAnalytics, setSelectedUserAnalytics] = useState<{
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
  const [loadingUserAnalytics, setLoadingUserAnalytics] = useState(false)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'stories') {
      // Load users first if not loaded (for filter dropdown), then load stories
      if (users.length === 0) {
        loadUsers().then(() => {
          // Small delay to ensure state is updated
          setTimeout(() => loadStories(), 100)
        })
      } else {
        loadStories()
      }
    }
  }, [activeTab, usersPage, usersSearch, usersSortBy, usersSortOrder])

  useEffect(() => {
    if (activeTab === 'stories') {
      // Only reload if stories tab is active and filters change
      if (users.length > 0 || !isLoading) {
        loadStories()
      }
    }
  }, [
    storiesPage,
    storiesSearch,
    storiesSortBy,
    storiesSortOrder,
    storiesFilterUserId,
    storiesFilterStatus,
  ])

  const loadStats = async () => {
    try {
      const response = await adminAPI.getStats()
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('Load stats error:', error)
      toast.error('Failed to load stats')
    } finally {
      setIsLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await adminAPI.getUsers({
        page: usersPage,
        limit: 20,
        sortBy: usersSortBy,
        sortOrder: usersSortOrder,
        search: usersSearch || undefined,
      })

      if (response.success && response.data) {
        setUsers(response.data.users)
        setUsersTotalPages(response.data.pagination.totalPages)
      } else {
        toast.error('Failed to load users')
      }
    } catch (error) {
      console.error('Load users error:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewUserStories = (userId: string) => {
    setStoriesFilterUserId(userId)
    setActiveTab('stories')
    setStoriesPage(1)
    // Load stories after switching tab
    setTimeout(() => {
      loadStories()
    }, 100)
  }

  const handleViewUserAnalytics = async (userId: string) => {
    try {
      setLoadingUserAnalytics(true)
      const response = await adminAPI.getUserAnalytics(userId)

      if (response.success && response.data) {
        setSelectedUserAnalytics(response.data)
        setUserAnalyticsDialogOpen(true)
      } else {
        toast.error('Failed to load user analytics')
      }
    } catch (error) {
      console.error('Load user analytics error:', error)
      toast.error('Failed to load user analytics')
    } finally {
      setLoadingUserAnalytics(false)
    }
  }

  const loadStories = async () => {
    try {
      setIsLoading(true)
      const response = await adminAPI.getAllStories({
        page: storiesPage,
        limit: 20,
        sortBy: storiesSortBy,
        sortOrder: storiesSortOrder,
        userId: storiesFilterUserId || undefined,
        status: storiesFilterStatus || undefined,
        search: storiesSearch || undefined,
      })

      if (response.success && response.data) {
        setStories(response.data.stories)
        setStoriesTotalPages(response.data.pagination.totalPages)
      } else {
        toast.error('Failed to load stories')
      }
    } catch (error) {
      console.error('Load stories error:', error)
      toast.error('Failed to load stories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditStory = (story: Story) => {
    navigate(`/edit/${story.uniqueId}`)
  }

  const handleDeleteStory = (story: Story) => {
    setStoryToDelete(story)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!storyToDelete) return

    try {
      const response = await adminAPI.deleteStory(storyToDelete.id)

      if (response.success) {
        toast.success('Story deleted successfully')
        loadStories()
      } else {
        toast.error('Failed to delete story')
      }
    } catch (error) {
      console.error('Delete story error:', error)
      toast.error('Failed to delete story')
    } finally {
      setDeleteDialogOpen(false)
      setStoryToDelete(null)
    }
  }

  const handleSortUsers = (field: string) => {
    if (usersSortBy === field) {
      setUsersSortOrder(usersSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setUsersSortBy(field)
      setUsersSortOrder('asc')
    }
  }

  const handleSortStories = (field: string) => {
    if (storiesSortBy === field) {
      setStoriesSortOrder(storiesSortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setStoriesSortBy(field)
      setStoriesSortOrder('asc')
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-2 border-b">
        <Button
          variant={activeTab === 'stats' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </Button>
        <Button
          variant={activeTab === 'users' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('users')}
        >
          Users
        </Button>
        <Button
          variant={activeTab === 'stories' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('stories')}
        >
          Stories
        </Button>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                All registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Advertisers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPublishers}</div>
              <p className="text-xs text-muted-foreground">
                Advertiser accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Stories
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStories}</div>
              <p className="text-xs text-muted-foreground">
                All stories created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalViews.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Story views</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Impressions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalImpressions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Story impressions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name..."
                value={usersSearch}
                onChange={(e) => {
                  setUsersSearch(e.target.value)
                  setUsersPage(1)
                }}
                className="pl-8"
              />
            </div>
            <Select
              value={usersSortBy}
              onValueChange={(value) => {
                setUsersSortBy(value)
                setUsersPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => handleSortUsers(usersSortBy)}
            >
              {usersSortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage all users on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead
                          className="cursor-pointer"
                          onClick={() => handleSortUsers('storyCount')}
                        >
                          Stories{' '}
                          {usersSortBy === 'storyCount' &&
                            (usersSortOrder === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.name || '-'}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === 'admin' ? 'default' : 'secondary'
                              }
                            >
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.storyCount}</TableCell>
                          <TableCell>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              {user.storyCount > 0 && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleViewUserStories(user.id)
                                    }
                                  >
                                    <Eye className="mr-1 h-4 w-4" />
                                    Stories
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleViewUserAnalytics(user.id)
                                    }
                                  >
                                    <BarChart3 className="mr-1 h-4 w-4" />
                                    Analytics
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {usersPage} of {usersTotalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                        disabled={usersPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setUsersPage((p) => Math.min(usersTotalPages, p + 1))
                        }
                        disabled={usersPage === usersTotalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stories Tab */}
      {activeTab === 'stories' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 space-x-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stories..."
                value={storiesSearch}
                onChange={(e) => {
                  setStoriesSearch(e.target.value)
                  setStoriesPage(1)
                }}
                className="pl-8"
              />
            </div>
            <Select
              value={storiesFilterUserId || 'all'}
              onValueChange={(value) => {
                setStoriesFilterUserId(value === 'all' ? '' : value)
                setStoriesPage(1)
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={storiesFilterStatus || 'all'}
              onValueChange={(value) => {
                setStoriesFilterStatus(value === 'all' ? '' : value)
                setStoriesPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={storiesSortBy}
              onValueChange={(value) => {
                setStoriesSortBy(value)
                setStoriesPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => handleSortStories(storiesSortBy)}
            >
              {storiesSortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Stories</CardTitle>
              <CardDescription>
                Manage all stories on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Publisher</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stories.map((story) => (
                        <TableRow key={story.id}>
                          <TableCell className="font-medium">
                            {story.title}
                          </TableCell>
                          <TableCell>{story.publisherName}</TableCell>
                          <TableCell>{story.user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                story.status === 'published'
                                  ? 'default'
                                  : story.status === 'draft'
                                    ? 'secondary'
                                    : 'outline'
                              }
                            >
                              {story.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(story.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStory(story)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStory(story)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Page {storiesPage} of {storiesTotalPages}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStoriesPage((p) => Math.max(1, p - 1))
                        }
                        disabled={storiesPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStoriesPage((p) =>
                            Math.min(storiesTotalPages, p + 1)
                          )
                        }
                        disabled={storiesPage === storiesTotalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Story</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{storyToDelete?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Analytics Dialog */}
      <Dialog
        open={userAnalyticsDialogOpen}
        onOpenChange={setUserAnalyticsDialogOpen}
      >
        <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Analytics for {selectedUserAnalytics?.user.email}
            </DialogTitle>
            <DialogDescription>
              View analytics for all stories created by this user
            </DialogDescription>
          </DialogHeader>
          {loadingUserAnalytics ? (
            <div className="py-8 text-center">Loading analytics...</div>
          ) : selectedUserAnalytics &&
            selectedUserAnalytics.analytics.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Stories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUserAnalytics.analytics.length}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUserAnalytics.analytics.reduce(
                        (sum, a) => sum + a.views,
                        0
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Impressions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUserAnalytics.analytics.reduce(
                        (sum, a) => sum + a.impressions,
                        0
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Clicks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {selectedUserAnalytics.analytics.reduce(
                        (sum, a) => sum + (a.clicks || 0),
                        0
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                    {selectedUserAnalytics.analytics.map((analytics) => (
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
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No analytics data available for this user
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

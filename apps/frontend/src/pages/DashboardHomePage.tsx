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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Edit, Trash2, MoreVertical, Plus, Calendar, User, Eye, TrendingUp, BarChart3 } from 'lucide-react'
import { storyAPI, analyticsAPI } from '@/lib/api'
import { Story } from '@snappy/shared-types'
import type { StoryAnalytics } from '@/lib/api'

export default function DashboardHomePage() {
  const navigate = useNavigate()
  const [stories, setStories] = useState<Story[]>([])
  const [analytics, setAnalytics] = useState<StoryAnalytics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null)

  // Load user stories
  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    try {
      setIsLoading(true)
      const [storiesResponse, analyticsResponse] = await Promise.all([
        storyAPI.getUserStories(),
        analyticsAPI.getUserStoriesAnalytics(),
      ])

      if (storiesResponse.success && storiesResponse.data) {
        setStories(storiesResponse.data)
      } else {
        toast.error('Failed to load stories')
      }

      if (analyticsResponse.success && analyticsResponse.data) {
        setAnalytics(analyticsResponse.data)
      }
    } catch (error) {
      console.error('Load stories error:', error)
      toast.error('Failed to load stories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (story: Story) => {
    navigate(`/edit/${story.uniqueId}`)
  }

  const handleDelete = (story: Story) => {
    setStoryToDelete(story)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!storyToDelete) return

    try {
      const response = await storyAPI.deleteStory(storyToDelete.id)

      if (response.success) {
        toast.success('Story deleted successfully')
        setStories(stories.filter((s) => s.id !== storyToDelete.id))
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

  const getCtaTypeLabel = (ctaType?: string) => {
    switch (ctaType) {
      case 'redirect':
        return 'Redirect'
      case 'form':
        return 'Form'
      case 'promo':
        return 'Promo'
      case 'sell':
        return 'Sell'
      default:
        return 'None'
    }
  }

  // Removed status badge logic

  const getStoryTypeColor = (storyType: string) => {
    switch (storyType) {
      case 'dynamic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'static':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get analytics for a story
  const getStoryAnalytics = (storyId: string): StoryAnalytics | undefined => {
    return analytics.find((a) => a.storyId === storyId)
  }

  const handleViewAnalytics = (story: Story) => {
    navigate(`/analytics/${story.id}`)
  }

  // Choose a thumbnail: prefer first image background from frames, fallback to publisherPic
  const getStoryThumbnailUrl = (story: Story): string | undefined => {
    // Try first frame with image background
    const frames: any[] = (story as any).frames || []
    for (const f of frames) {
      if (f?.background?.type === 'image' && f?.background?.value) {
        return f.background.value
      }
    }
    // Fallback to publisherPic if available
    if (story.publisherPic) return story.publisherPic
    return undefined
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Stories</h1>
            <p className="text-muted-foreground">
              Manage and edit your web stories
            </p>
          </div>
          <Button onClick={() => navigate('/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Story
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 w-3/4 rounded bg-muted"></div>
                <div className="h-3 w-1/2 rounded bg-muted"></div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 h-32 rounded bg-muted"></div>
                <div className="space-y-2">
                  <div className="h-3 w-full rounded bg-muted"></div>
                  <div className="h-3 w-2/3 rounded bg-muted"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Stories</h1>
          <p className="text-muted-foreground">
            Manage and edit your web stories
          </p>
        </div>
        <Button onClick={() => navigate('/create')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Story
        </Button>
      </div>

      {stories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No stories yet</h3>
                <p className="text-muted-foreground">
                  Create your first web story to get started
                </p>
              </div>
              <Button onClick={() => navigate('/create')}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Story
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="group transition-shadow hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="truncate text-lg">
                        {story.title}
                      </CardTitle>
                      <Badge className={getStoryTypeColor(story.storyType)}>
                        {story.storyType === 'dynamic' ? 'Dynamic' : 'Static'}
                      </Badge>
                    </div>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="truncate">{story.publisherName}</span>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(story)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(story)}
                        className="text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  {(() => {
                    const thumb = getStoryThumbnailUrl(story)
                    return thumb ? (
                      <img
                        src={thumb}
                        alt={story.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-sm text-muted-foreground">
                          No thumbnail
                        </div>
                      </div>
                    )
                  })()}
                  {/* Removed status/draft badge */}
                </div>

                {/* Story Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CTA Type:</span>
                    <Badge variant="outline">
                      {getCtaTypeLabel(story.ctaType)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(story.createdAt)}
                    </span>
                  </div>
                  {story.frames && story.frames.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Frames:</span>
                      <span>{story.frames.length}</span>
                    </div>
                  )}
                  {/* Analytics Metrics */}
                  {(() => {
                    const storyAnalytics = getStoryAnalytics(story.id)
                    if (storyAnalytics) {
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm border-t pt-2">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              Views:
                            </span>
                            <span className="font-medium">{storyAnalytics.views}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              Impressions:
                            </span>
                            <span className="font-medium">{storyAnalytics.impressions}</span>
                          </div>
                        </>
                      )
                    }
                    return null
                  })()}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(story)}
                    className="w-full"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewAnalytics(story)}
                    className="w-full"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    See Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
          <div className="flex justify-end gap-2">
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
    </div>
  )
}

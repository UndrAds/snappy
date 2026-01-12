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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Upload,
  Save,
  Info,
  Rss,
  Smartphone,
  Monitor,
  Megaphone,
} from 'lucide-react'
import { storyAPI, uploadAPI, rssAPI, adminAPI } from '@/lib/api'
import RSSProgressLoader from '@/components/RSSProgressLoader'
import { Story, AdInsertionConfig } from '@snappy/shared-types'
import StoryFrame from '@/components/StoryFrame'
import { useAuth } from '@/hooks/useAuth'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function EditStoryPage() {
  const navigate = useNavigate()
  const { uniqueId } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [story, setStory] = useState<Story | null>(null)
  const [frames, setFrames] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showProgressLoader, setShowProgressLoader] = useState(false)
  const [originalRSSConfig, setOriginalRSSConfig] = useState<any | null>(null)
  const [originalDefaultDurationMs, setOriginalDefaultDurationMs] = useState<
    number | null
  >(null)
  // Store story IDs for RSS completion callback (similar to CreateSnapPage)
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null)
  const [currentStoryUniqueId, setCurrentStoryUniqueId] = useState<
    string | null
  >(null)

  // Advertiser search state (admin only)
  const [advertiserSearch, setAdvertiserSearch] = useState('')
  const [advertisers, setAdvertisers] = useState<
    Array<{
      id: string
      email: string
      name: string | null
      displayText: string
    }>
  >([])
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<{
    id: string
    email: string
    name: string | null
    displayText: string
  } | null>(null)
  const [isLoadingAdvertisers, setIsLoadingAdvertisers] = useState(false)

  // Load story data
  useEffect(() => {
    if (uniqueId) {
      loadStory()
    }
  }, [uniqueId])

  // Initialize adInsertionConfig when story is dynamic and doesn't have it
  useEffect(() => {
    if (
      story &&
      story.storyType === 'dynamic' &&
      !(story as any).rssConfig?.adInsertionConfig
    ) {
      setStory((prev) =>
        prev
          ? {
              ...prev,
              rssConfig: {
                ...(prev as any).rssConfig,
                adInsertionConfig: {
                  strategy: 'start-end',
                },
              },
            }
          : null
      )
    }
  }, [story])

  // Load story owner when story is loaded (admin only)
  useEffect(() => {
    if (!isAdmin || !story) return

    const userId = (story as any).userId
    if (userId && !selectedAdvertiser) {
      // Load the story owner to pre-fill the advertiser field
      adminAPI
        .getUserById(userId)
        .then((userResponse) => {
          if (userResponse.success && userResponse.data) {
            const owner = userResponse.data.user
            const ownerAsAdvertiser = {
              id: owner.id,
              email: owner.email,
              name: owner.name,
              displayText: owner.displayText,
            }
            setSelectedAdvertiser(ownerAsAdvertiser)
            setAdvertiserSearch(owner.displayText)
          }
        })
        .catch((error) => {
          console.error('Failed to load story owner:', error)
          // Fallback: try to find in advertisers list
          adminAPI
            .getAdvertisers({ search: '' })
            .then((advResponse) => {
              if (advResponse.success && advResponse.data) {
                const currentAdvertiser = advResponse.data.advertisers.find(
                  (a) => a.id === userId
                )
                if (currentAdvertiser) {
                  setSelectedAdvertiser(currentAdvertiser)
                  setAdvertiserSearch(currentAdvertiser.displayText)
                }
              }
            })
            .catch((advError) => {
              console.error('Failed to load current advertiser:', advError)
            })
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, isAdmin])

  // Load advertisers when admin searches (debounced)
  useEffect(() => {
    if (!isAdmin) return

    const timeoutId = setTimeout(() => {
      if (advertiserSearch.trim().length >= 2) {
        loadAdvertisers(advertiserSearch.trim())
      } else if (advertiserSearch.trim().length === 0) {
        // Load initial list when search is cleared
        loadAdvertisers('')
      } else {
        setAdvertisers([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [advertiserSearch, isAdmin])

  const loadAdvertisers = async (search: string) => {
    try {
      setIsLoadingAdvertisers(true)
      const response = await adminAPI.getAdvertisers({ search })
      if (response.success && response.data) {
        setAdvertisers(response.data.advertisers)
      }
    } catch (error) {
      console.error('Failed to load advertisers:', error)
    } finally {
      setIsLoadingAdvertisers(false)
    }
  }

  const loadStory = async () => {
    try {
      setIsLoading(true)
      const response = await storyAPI.getStoryByUniqueId(uniqueId!)

      if (response.success && response.data) {
        const storyData = response.data
        setStory(storyData)
        // Load frames from story data
        if (
          (response.data as any).frames &&
          Array.isArray((response.data as any).frames)
        ) {
          setFrames((response.data as any).frames)
        }
        // Capture original defaultDurationMs for change detection
        setOriginalDefaultDurationMs(
          (response.data as any).defaultDurationMs || 5000
        )
        // Capture original RSS config snapshot for change detection
        if (response.data.storyType === 'dynamic') {
          setOriginalRSSConfig((response.data as any).rssConfig || null)
        } else {
          setOriginalRSSConfig(null)
        }
      } else {
        toast.error('Story not found')
        navigate('/')
      }
    } catch (error) {
      console.error('Load story error:', error)
      toast.error('Failed to load story')
      navigate('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (
    field: string,
    value: string | number | undefined
  ) => {
    if (!story) return

    setStory((prev) =>
      prev
        ? ({
            ...prev,
            [field]: value,
          } as any)
        : null
    )
  }

  const handlePublisherPicUpload = async (file: File) => {
    if (!story) return

    try {
      setIsUploading(true)

      const response = await uploadAPI.uploadSingle(file)

      if (response.success && response.data) {
        const url = response.data.url
        setStory((prev) =>
          prev
            ? {
                ...prev,
                publisherPic: url,
              }
            : null
        )

        toast.success('File uploaded successfully!')
      } else {
        toast.error('Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveAndEdit = async () => {
    if (!story) return

    try {
      setIsSaving(true)

      // Update story metadata
      const updateData: any = {
        title: story.title,
        publisherName: story.publisherName,
        publisherPic: story.publisherPic,
        format: story.format || 'portrait',
        deviceFrame: story.deviceFrame || 'mobile',
        storyType: story.storyType || 'static',
        defaultDurationMs: (story as any).defaultDurationMs,
        cpm: (story as any).cpm,
        rssConfig:
          story.storyType === 'dynamic'
            ? (story as any).rssConfig || undefined
            : null,
      }

      // Include userId if admin is reassigning
      if (isAdmin && selectedAdvertiser) {
        updateData.userId = selectedAdvertiser.id
      }

      const response = await storyAPI.updateStory(story.id, updateData)

      if (response.success) {
        // Check if defaultDurationMs has changed from the original
        const currentDefaultDurationMs =
          (story as any).defaultDurationMs || 5000
        const hasTimerChanged =
          originalDefaultDurationMs !== null &&
          currentDefaultDurationMs !== originalDefaultDurationMs

        // If timer has changed, update all frames with the new defaultDurationMs
        if (hasTimerChanged && frames.length > 0) {
          const updatePromises = frames.map((frame) =>
            storyAPI.updateStoryFrame(frame.id, {
              durationMs: currentDefaultDurationMs,
            } as any)
          )

          try {
            await Promise.all(updatePromises)
            toast.success(
              `Story and ${frames.length} frame(s) updated successfully!`
            )
          } catch (frameError) {
            console.error('Failed to update some frames:', frameError)
            toast.warning(
              'Story updated, but some frames failed to update. Please try again.'
            )
          }
        } else {
          toast.success('Story updated successfully!')
        }

        // If dynamic story, check if RSS config changed
        const isDynamic = story.storyType === 'dynamic'
        const currentRSS: any = (story as any).rssConfig || null
        const rssChanged =
          isDynamic && hasRSSConfigChanged(originalRSSConfig, currentRSS)

        // Check if only ad insertion config changed (doesn't need RSS reprocessing)
        const adConfigChanged =
          isDynamic &&
          currentRSS?.adInsertionConfig &&
          JSON.stringify(originalRSSConfig?.adInsertionConfig || {}) !==
            JSON.stringify(currentRSS?.adInsertionConfig || {})

        if (isDynamic && rssChanged) {
          try {
            // Update RSS config first to ensure it's saved
            await rssAPI.updateRSSConfig(story.id, currentRSS)

            // Trigger RSS processing for the updated config
            await rssAPI.triggerRSSUpdate(story.id)
          } catch (e) {
            // Even if trigger fails, still show the modal to poll status (backend may have auto-triggered)
            console.error('Failed to trigger RSS update explicitly:', e)
          }

          // Store story IDs before showing loader (for callback access)
          setCurrentStoryId(story.id)
          setCurrentStoryUniqueId(story.uniqueId)
          setShowProgressLoader(true)
        } else if (adConfigChanged) {
          // Only ad insertion config changed - update RSS config and go to editor
          try {
            // Update RSS config to save ad insertion config
            await rssAPI.updateRSSConfig(story.id, currentRSS)
            toast.success('Ad insertion configuration updated')
          } catch (e) {
            console.error('Failed to update RSS config:', e)
            toast.error('Failed to update ad insertion configuration')
          }

          // Navigate to editor so ads can be applied
          navigate(`/editor/${story.uniqueId}`, {
            state: {
              storyId: story.id,
              uniqueId: story.uniqueId,
              fromCreate: false,
              isDynamic: isDynamic,
            },
          })
        } else {
          // Navigate to editor
          navigate(`/editor/${story.uniqueId}`, {
            state: {
              storyId: story.id,
              uniqueId: story.uniqueId,
              fromCreate: false,
              isDynamic: isDynamic,
            },
          })
        }
      } else {
        toast.error('Failed to update story')
      }
    } catch (error) {
      console.error('Update story error:', error)
      toast.error('Failed to update story')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle RSS processing completion
  const handleProgressComplete = () => {
    // Capture values from state to ensure they're available
    const storyId = currentStoryId
    const storyUniqueId = currentStoryUniqueId

    console.log('handleProgressComplete called', {
      storyId,
      storyUniqueId,
      currentStoryUniqueId,
      currentStoryId,
    })

    if (storyUniqueId && storyId) {
      console.log('Navigating to editor:', `/editor/${storyUniqueId}`)
      // Close modal immediately
      setShowProgressLoader(false)

      // Navigate immediately - use window.location as primary method for reliability
      // This ensures navigation happens even if React Router has issues
      setTimeout(() => {
        console.log('Executing navigation...')
        try {
          // Try React Router navigation first
          navigate(`/editor/${storyUniqueId}`, {
            state: {
              storyId: storyId,
              uniqueId: storyUniqueId,
              fromCreate: false,
              isDynamic: true,
            },
            replace: true,
          })
          console.log('React Router navigation called')

          // Fallback: if navigation doesn't work after 500ms, use window.location
          setTimeout(() => {
            // Check if we're still on the same page (navigation didn't work)
            if (window.location.pathname.includes('/edit/')) {
              console.warn(
                'Navigation may have failed, using window.location fallback'
              )
              window.location.href = `/editor/${storyUniqueId}`
            }
          }, 500)
        } catch (error) {
          console.error('Navigation error, using window.location:', error)
          // Fallback to window.location if navigate fails
          window.location.href = `/editor/${storyUniqueId}`
        }
      }, 100)
    } else {
      // Close modal even if navigation fails
      setShowProgressLoader(false)
      console.error('Cannot navigate: missing IDs', {
        storyUniqueId,
        storyId,
        currentStoryUniqueId,
        currentStoryId,
      })
      toast.error('Failed to navigate to editor. Please refresh the page.')
    }

    // Refresh original snapshot to new config
    if (story) {
      setOriginalRSSConfig((story as any)?.rssConfig || null)
    }

    // Clear story IDs
    setCurrentStoryId(null)
    setCurrentStoryUniqueId(null)
  }

  // Handle RSS processing error
  const handleProgressError = () => {
    setShowProgressLoader(false)
    toast.error('RSS processing failed. You can still edit the story manually.')
    // Clear story IDs
    setCurrentStoryId(null)
    setCurrentStoryUniqueId(null)
  }

  // Helper: compare RSS config changes
  const hasRSSConfigChanged = (
    originalCfg: any | null,
    currentCfg: any | null
  ) => {
    const o = originalCfg || {}
    const c = currentCfg || {}

    // Check basic RSS config changes
    const basicConfigChanged =
      o.feedUrl !== c.feedUrl ||
      Number(o.updateIntervalMinutes ?? 0) !==
        Number(c.updateIntervalMinutes ?? 0) ||
      Number(o.maxPosts ?? 0) !== Number(c.maxPosts ?? 0) ||
      Boolean(o.allowRepetition) !== Boolean(c.allowRepetition) ||
      Boolean(o.isActive) !== Boolean(c.isActive)

    // Check ad insertion config changes
    const adConfigChanged =
      JSON.stringify(o.adInsertionConfig || {}) !==
      JSON.stringify(c.adInsertionConfig || {})

    return basicConfigChanged || adConfigChanged
  }

  const FileUpload = ({
    label,
    onFileSelect,
    currentUrl,
    accept = 'image/*',
  }: {
    label: string
    onFileSelect: (file: File) => void
    currentUrl?: string
    accept?: string
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() =>
            document
              .getElementById(
                `${label.toLowerCase().replace(/\s+/g, '-')}-upload`
              )
              ?.click()
          }
          className="flex items-center space-x-2"
          disabled={isUploading}
        >
          <Upload className="h-4 w-4" />
          <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
        </Button>
        {currentUrl && (
          <div className="flex items-center space-x-2">
            <img
              src={currentUrl}
              alt="Current"
              className="h-8 w-8 rounded object-cover"
            />
            <span className="text-sm text-muted-foreground">Current</span>
          </div>
        )}
      </div>
      <input
        id={`${label.toLowerCase().replace(/\s+/g, '-')}-upload`}
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFileSelect(file)
        }}
        className="hidden"
      />
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading story...</p>
        </div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Story not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Main Content */}
      <div className="flex flex-1 space-x-6 overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Edit Story</h2>
            <p className="text-muted-foreground">
              Update your web story settings
            </p>
          </div>

          {/* Story Name */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update the name for your story</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="story-name">Story Name</Label>
                <Input
                  id="story-name"
                  placeholder="Enter your story name"
                  value={story.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Advertiser Selection - Admin Only */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Assign to Advertiser</CardTitle>
                <CardDescription>
                  Change which advertiser this story belongs to
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="advertiser-search">Advertiser</Label>
                  <div className="space-y-2">
                    <Input
                      id="advertiser-search"
                      placeholder="Search by email or name..."
                      value={advertiserSearch}
                      onChange={(e) => setAdvertiserSearch(e.target.value)}
                      onFocus={() => {
                        if (advertisers.length === 0 && !isLoadingAdvertisers) {
                          loadAdvertisers('')
                        }
                      }}
                    />
                    {advertiserSearch && advertisers.length > 0 && (
                      <div className="max-h-60 overflow-auto rounded-md border bg-background">
                        {advertisers.map((advertiser) => (
                          <div
                            key={advertiser.id}
                            className="cursor-pointer border-b px-4 py-2 last:border-b-0 hover:bg-accent"
                            onClick={() => {
                              setSelectedAdvertiser(advertiser)
                              setAdvertiserSearch(advertiser.displayText)
                            }}
                          >
                            <div className="text-sm font-medium">
                              {advertiser.displayText}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedAdvertiser && (
                      <div className="mt-2 rounded-md bg-muted p-2">
                        <div className="text-sm text-foreground">
                          <span className="font-medium">Selected: </span>
                          {selectedAdvertiser.displayText}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-6 text-xs"
                          onClick={() => {
                            setSelectedAdvertiser(null)
                            setAdvertiserSearch('')
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                    {isLoadingAdvertisers && (
                      <div className="text-sm text-muted-foreground">
                        Loading advertisers...
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CPM Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Revenue Settings
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="text-sm">
                          CPM (Cost Per Mille) is the cost per 1000 impressions.
                          Revenue will be calculated as: (CPM × Impressions) ÷
                          1000
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Set your CPM rate for revenue calculation in analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpm">CPM (Cost Per Mille)</Label>
                <Input
                  id="cpm"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g., 2.50"
                  value={
                    (story as any).cpm !== null &&
                    (story as any).cpm !== undefined
                      ? String((story as any).cpm)
                      : '0'
                  }
                  onChange={(e) =>
                    handleInputChange(
                      'cpm',
                      e.target.value !== ''
                        ? parseFloat(e.target.value) || 0
                        : 0
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Set your CPM rate to calculate revenue in analytics
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Publisher Section */}
          <Card>
            <CardHeader>
              <CardTitle>Publisher Information</CardTitle>
              <CardDescription>
                Update publisher details for your story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publisher-name">Publisher Name</Label>
                <Input
                  id="publisher-name"
                  placeholder="Enter publisher name"
                  value={story.publisherName}
                  onChange={(e) =>
                    handleInputChange('publisherName', e.target.value)
                  }
                />
              </div>
              <FileUpload
                label="Publisher Profile Picture"
                onFileSelect={(file) => handlePublisherPicUpload(file)}
                currentUrl={story.publisherPic}
              />
            </CardContent>
          </Card>

          {/* Story Type & RSS Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Story Type
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Static: Manual content creation</p>
                      <p>Dynamic: Auto-generated from RSS feed</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Choose whether your story will be static or dynamic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="story-type">Story Type</Label>
                <RadioGroup
                  value={story.storyType || 'static'}
                  onValueChange={(value) => {
                    setStory((prev) =>
                      prev
                        ? {
                            ...prev,
                            storyType: value as any,
                            // Initialize rssConfig when switching to dynamic, but preserve existing values
                            ...(value === 'dynamic'
                              ? {
                                  rssConfig: (prev as any).rssConfig || {
                                    feedUrl: '',
                                    updateIntervalMinutes: 15,
                                    maxPosts: 10,
                                    allowRepetition: false,
                                    isActive: true,
                                  },
                                }
                              : {}), // Don't clear rssConfig when switching to static
                          }
                        : null
                    )
                  }}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="static" id="static" />
                    <Label htmlFor="static">Static Story</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dynamic" id="dynamic" />
                    <Label htmlFor="dynamic">Dynamic Story</Label>
                  </div>
                </RadioGroup>
              </div>

              {story.storyType === 'dynamic' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Rss className="h-5 w-5" />
                      RSS Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure RSS feed settings for dynamic content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="rss-feed-url">RSS Feed URL</Label>
                      <Input
                        id="rss-feed-url"
                        placeholder="https://example.com/feed.xml"
                        value={(story as any).rssConfig?.feedUrl || ''}
                        onChange={(e) =>
                          setStory((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rssConfig: {
                                    ...(prev as any).rssConfig,
                                    feedUrl: e.target.value,
                                  },
                                }
                              : null
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="rss-interval">
                          Update Interval (mins)
                        </Label>
                        <Input
                          id="rss-interval"
                          type="number"
                          min={5}
                          value={
                            (story as any).rssConfig?.updateIntervalMinutes ??
                            15
                          }
                          onChange={(e) =>
                            setStory((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rssConfig: {
                                      ...(prev as any).rssConfig,
                                      updateIntervalMinutes: Number(
                                        e.target.value || 0
                                      ),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rss-max-posts">Max Posts</Label>
                        <Input
                          id="rss-max-posts"
                          type="number"
                          min={1}
                          max={50}
                          value={(story as any).rssConfig?.maxPosts ?? 10}
                          onChange={(e) =>
                            setStory((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rssConfig: {
                                      ...(prev as any).rssConfig,
                                      maxPosts: Number(e.target.value || 0),
                                    },
                                  }
                                : null
                            )
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Allow Repetition</Label>
                        <div className="flex h-10 items-center space-x-2 rounded-md border px-3">
                          <input
                            id="rss-allow-repetition"
                            type="checkbox"
                            className="h-4 w-4"
                            checked={
                              (story as any).rssConfig?.allowRepetition ?? false
                            }
                            onChange={(e) =>
                              setStory((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rssConfig: {
                                        ...(prev as any).rssConfig,
                                        allowRepetition: e.target.checked,
                                      },
                                    }
                                  : null
                              )
                            }
                          />
                          <Label htmlFor="rss-allow-repetition" className="m-0">
                            Allow repeating posts
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>RSS Processing</Label>
                      <div className="flex h-10 items-center space-x-2 rounded-md border px-3">
                        <input
                          id="rss-is-active"
                          type="checkbox"
                          className="h-4 w-4"
                          checked={(story as any).rssConfig?.isActive ?? true}
                          onChange={(e) =>
                            setStory((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    rssConfig: {
                                      ...(prev as any).rssConfig,
                                      isActive: e.target.checked,
                                    },
                                  }
                                : null
                            )
                          }
                        />
                        <Label htmlFor="rss-is-active" className="m-0">
                          Enable automatic updates
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ad Configuration - Only show for dynamic stories */}
              {story.storyType === 'dynamic' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      Ad Configuration
                    </CardTitle>
                    <CardDescription>
                      Configure how and where ads should be automatically
                      inserted in your dynamic story
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Ad Insertion Strategy</Label>
                      <RadioGroup
                        value={
                          (story as any).rssConfig?.adInsertionConfig
                            ?.strategy || 'start-end'
                        }
                        onValueChange={(value) => {
                          const strategy =
                            value as AdInsertionConfig['strategy']
                          setStory((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  rssConfig: {
                                    ...(prev as any).rssConfig,
                                    adInsertionConfig: {
                                      strategy,
                                      ...(strategy === 'interval'
                                        ? {
                                            interval:
                                              (prev as any).rssConfig
                                                ?.adInsertionConfig?.interval ||
                                              3,
                                            intervalPosition:
                                              (prev as any).rssConfig
                                                ?.adInsertionConfig
                                                ?.intervalPosition || 'after',
                                          }
                                        : {}),
                                    } as AdInsertionConfig,
                                  },
                                }
                              : null
                          )
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="start-end" id="start-end" />
                            <Label htmlFor="start-end">
                              Start & End (ads at beginning and end)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="alternate" id="alternate" />
                            <Label htmlFor="alternate">
                              Alternate each post (ad after each post)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="interval" id="interval" />
                            <Label htmlFor="interval">
                              After/before/between each N posts
                            </Label>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>

                    {(story as any).rssConfig?.adInsertionConfig?.strategy ===
                      'interval' && (
                      <div className="space-y-4 rounded-md border p-4">
                        <div className="space-y-2">
                          <Label htmlFor="ad-interval">
                            Number of Posts (N)
                          </Label>
                          <Input
                            id="ad-interval"
                            type="number"
                            min="1"
                            value={
                              (story as any).rssConfig?.adInsertionConfig
                                ?.interval || 3
                            }
                            onChange={(e) =>
                              setStory((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rssConfig: {
                                        ...(prev as any).rssConfig,
                                        adInsertionConfig: {
                                          ...(prev as any).rssConfig
                                            ?.adInsertionConfig,
                                          interval: Math.max(
                                            1,
                                            parseInt(e.target.value) || 3
                                          ),
                                        } as AdInsertionConfig,
                                      },
                                    }
                                  : null
                              )
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Insert an ad after every N posts
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Ad Position</Label>
                          <RadioGroup
                            value={
                              (story as any).rssConfig?.adInsertionConfig
                                ?.intervalPosition || 'after'
                            }
                            onValueChange={(value) =>
                              setStory((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      rssConfig: {
                                        ...(prev as any).rssConfig,
                                        adInsertionConfig: {
                                          ...(prev as any).rssConfig
                                            ?.adInsertionConfig,
                                          intervalPosition:
                                            value as AdInsertionConfig['intervalPosition'],
                                        } as AdInsertionConfig,
                                      },
                                    }
                                  : null
                              )
                            }
                          >
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="before" id="before" />
                                <Label htmlFor="before">Before posts</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="after" id="after" />
                                <Label htmlFor="after">After posts</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="between" id="between" />
                                <Label htmlFor="between">Between posts</Label>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Format and Device Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Story Format & Device</CardTitle>
              <CardDescription>
                Choose the format and device frame for your story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="story-format">Story Format</Label>
                  <Select
                    value={(story as any).format || 'portrait'}
                    onValueChange={(value) =>
                      setStory((prev) =>
                        prev ? { ...prev, format: value as any } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 w-3 rounded bg-muted"></div>
                          <span>Portrait (9:16)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="landscape">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-4 rounded bg-muted"></div>
                          <span>Landscape (16:9)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-frame">Device Frame</Label>
                  <Select
                    value={(story as any).deviceFrame || 'mobile'}
                    onValueChange={(value) =>
                      setStory((prev) =>
                        prev ? { ...prev, deviceFrame: value as any } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">
                        <div className="flex items-center space-x-2">
                          <Smartphone className="h-4 w-4" />
                          <span>Mobile</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="video-player">
                        <div className="flex items-center space-x-2">
                          <Monitor className="h-4 w-4" />
                          <span>Video Player</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Story Configuration (thumbnails removed) */}
          <Card>
            <CardHeader>
              <CardTitle>Story Configuration</CardTitle>
              <CardDescription>
                Update default settings for your story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Frame Duration</Label>
                <div className="flex flex-wrap gap-2">
                  {[5000, 10000, 15000, 20000, 30000].map((ms) => (
                    <Button
                      key={ms}
                      type="button"
                      variant={
                        ((story as any).defaultDurationMs || 2500) === ms
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        setStory((prev) =>
                          prev
                            ? ({ ...prev, defaultDurationMs: ms } as any)
                            : prev
                        )
                      }
                    >
                      {ms / 1000}s
                    </Button>
                  ))}
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      className="w-24"
                      value={Math.round(
                        ((story as any).defaultDurationMs || 2500) / 1000
                      )}
                      onChange={(e) =>
                        setStory((prev) =>
                          prev
                            ? ({
                                ...prev,
                                defaultDurationMs:
                                  Math.max(1, Number(e.target.value) || 5) *
                                  1000,
                              } as any)
                            : prev
                        )
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      seconds
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA removed: story-level CTA is no longer supported */}
        </div>

        {/* Right Panel - Mobile Preview */}
        <div className="w-124 flex-shrink-0 px-4">
          <div className="sticky flex h-full flex-col items-center justify-center">
            <StoryFrame
              publisherName={story.publisherName}
              storyTitle={story.title}
              publisherPic={story.publisherPic}
              mainContent={story.largeThumbnail}
              currentSlide={1}
              totalSlides={4}
              showProgressBar={true}
              isEditMode={false}
              format={(story as any).format || 'portrait'}
              deviceFrame={(story as any).deviceFrame || 'mobile'}
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar - Static */}
      <div className="border-t bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(story.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex space-x-4">
            <Button
              onClick={handleSaveAndEdit}
              className="flex items-center space-x-2"
              disabled={isSaving}
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Update & Edit'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* RSS Progress Loader for dynamic updates */}
      {showProgressLoader && currentStoryId && (
        <RSSProgressLoader
          storyId={currentStoryId}
          onComplete={handleProgressComplete}
          onError={handleProgressError}
        />
      )}
    </div>
  )
}

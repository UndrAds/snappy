import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { Switch } from '@/components/ui/switch'
import {
  Upload,
  Save,
  Smartphone,
  Monitor,
  Info,
  Rss,
  Megaphone,
} from 'lucide-react'
import { toast } from 'sonner'
import StoryFrame from '@/components/StoryFrame'
import { storyAPI, uploadAPI, rssAPI, adminAPI } from '@/lib/api'
import { useAuth } from '@/hooks/useAuth'
import type {
  StoryFormat,
  DeviceFrame,
  StoryType,
  RSSConfig,
  AdInsertionConfig,
} from '@snappy/shared-types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import RSSProgressLoader from '@/components/RSSProgressLoader'

interface SnapData {
  name: string
  publisher: {
    name: string
    profilePic: File | null
  }
  // thumbnails removed
  format: StoryFormat
  deviceFrame: DeviceFrame
  storyType: StoryType
  rssConfig?: RSSConfig
  defaultDurationMs?: number
  cpm?: number
  userId?: string // For admin to assign story to advertiser
}

export default function CreateSnapPage() {
  const defaultPublisherPic =
    'https://ui-avatars.com/api/?name=John+Doe&background=random'
  // default thumbnails removed

  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [snapData, setSnapData] = useState<SnapData>({
    name: 'My Amazing Story',
    publisher: {
      name: 'John Doe',
      profilePic: null, // File upload will still work, but preview will use default
    },
    // thumbnails removed
    format: 'portrait' as const,
    deviceFrame: 'mobile' as const,
    storyType: 'static' as const,
    rssConfig: undefined,
    defaultDurationMs: 2500,
    cpm: undefined,
    userId: undefined,
  })

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

  const [previewUrls, setPreviewUrls] = useState<{
    publisherPic?: string
  }>({
    publisherPic: defaultPublisherPic,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [rssConfig, setRssConfig] = useState<RSSConfig>({
    feedUrl: '',
    updateIntervalMinutes: 60,
    maxPosts: 10,
    allowRepetition: false,
    isActive: true,
  })
  const [isValidatingFeed, setIsValidatingFeed] = useState(false)
  const [showProgressLoader, setShowProgressLoader] = useState(false)
  const [currentStoryId, setCurrentStoryId] = useState<string | null>(null)
  const [currentStoryUniqueId, setCurrentStoryUniqueId] = useState<
    string | null
  >(null)

  // Initialize adInsertionConfig when story type is dynamic
  useEffect(() => {
    if (snapData.storyType === 'dynamic' && !rssConfig.adInsertionConfig) {
      setRssConfig((prev) => ({
        ...prev,
        adInsertionConfig: {
          strategy: 'start-end',
        },
      }))
    }
  }, [snapData.storyType, rssConfig.adInsertionConfig])

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

  const handleInputChange = (
    field: string,
    value: string | number | undefined
  ) => {
    setSnapData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handlePublisherChange = (field: string, value: string) => {
    setSnapData((prev) => ({
      ...prev,
      publisher: {
        ...prev.publisher,
        [field]: value,
      },
    }))
  }

  const handlePublisherPicUpload = async (file: File) => {
    try {
      setIsLoading(true)

      // Upload file to backend
      const response = await uploadAPI.uploadSingle(file)

      if (response.success && response.data) {
        const url = response.data.url
        setPreviewUrls((prev) => ({ ...prev, publisherPic: url }))

        setSnapData((prev) => ({
          ...prev,
          publisher: { ...prev.publisher, profilePic: file },
        }))

        toast.success('File uploaded successfully!')
      } else {
        toast.error('Failed to upload file')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsLoading(false)
    }
  }

  // CTA removed: story-level CTA no longer supported

  const handleStoryTypeChange = (value: StoryType) => {
    setSnapData((prev) => ({
      ...prev,
      storyType: value,
    }))
  }

  const handleRssConfigChange = (field: keyof RSSConfig, value: any) => {
    setRssConfig((prev: RSSConfig) => ({
      ...prev,
      [field]: value,
    }))
  }

  const validateRSSFeed = async () => {
    if (!rssConfig.feedUrl) {
      toast.error('Please enter an RSS feed URL')
      return false
    }

    try {
      setIsValidatingFeed(true)
      const response = await rssAPI.validateFeedUrl(rssConfig.feedUrl)

      if (response.success && response.data?.isValid) {
        toast.success('RSS feed is valid!')
        return true
      } else {
        toast.error('Invalid RSS feed URL')
        return false
      }
    } catch (error) {
      console.error('RSS validation error:', error)
      toast.error('Failed to validate RSS feed')
      return false
    } finally {
      setIsValidatingFeed(false)
    }
  }

  const handleFormatChange = (format: StoryFormat) => {
    setSnapData((prev) => ({
      ...prev,
      format,
    }))
  }

  const handleDeviceFrameChange = (deviceFrame: DeviceFrame) => {
    setSnapData((prev) => ({
      ...prev,
      deviceFrame,
    }))
  }

  const handleSaveAndEdit = async () => {
    if (!snapData.name.trim()) {
      toast.error('Please enter a snap name')
      return
    }
    if (!snapData.publisher.name.trim()) {
      toast.error('Please enter a publisher name')
      return
    }
    // Allow if either a file is uploaded or a default image is present
    if (!snapData.publisher.profilePic && !previewUrls.publisherPic) {
      toast.error('Please upload a publisher profile picture')
      return
    }
    // thumbnail requirements removed
    // No story-level CTA validation

    // Validate RSS configuration if dynamic story
    if (snapData.storyType === 'dynamic') {
      if (!rssConfig.feedUrl.trim()) {
        toast.error('Please enter an RSS feed URL')
        return
      }
      if (rssConfig.updateIntervalMinutes < 5) {
        toast.error('Update interval must be at least 5 minutes')
        return
      }
      if (rssConfig.maxPosts < 1 || rssConfig.maxPosts > 50) {
        toast.error('Max posts must be between 1 and 50')
        return
      }
    }

    try {
      setIsLoading(true)

      // Create story (both static and dynamic)
      const storyData: any = {
        title: snapData.name,
        publisherName: snapData.publisher.name,
        publisherPic: previewUrls.publisherPic,
        format: snapData.format,
        deviceFrame: snapData.deviceFrame,
        storyType: snapData.storyType,
        rssConfig: snapData.storyType === 'dynamic' ? rssConfig : undefined,
        cpm: snapData.cpm,
      }

      // Include userId if admin is assigning to advertiser
      if (isAdmin && selectedAdvertiser) {
        storyData.userId = selectedAdvertiser.id
      }

      const storyResponse = await storyAPI.createStory(storyData)

      if (storyResponse.success && storyResponse.data) {
        if (snapData.storyType === 'dynamic') {
          // Show progress loader for dynamic stories
          setCurrentStoryId(storyResponse.data.id)
          setCurrentStoryUniqueId(storyResponse.data.uniqueId)
          setShowProgressLoader(true)
          toast.success('Dynamic story created! Processing RSS feed...')
        } else {
          // Navigate directly to editor for static stories
          const editorData = {
            storyTitle: snapData.name,
            publisherName: snapData.publisher.name,
            publisherPic: previewUrls.publisherPic,
            thumbnail: '',
            background: '',
            format: snapData.format,
            deviceFrame: snapData.deviceFrame,
            defaultDurationMs: snapData.defaultDurationMs || 2500,
          }

          navigate(`/editor/${storyResponse.data.uniqueId}`, {
            state: {
              storyData: editorData,
              storyId: storyResponse.data.id,
              uniqueId: storyResponse.data.uniqueId,
              fromCreate: true,
            },
          })

          toast.success('Snap saved successfully! Moving to edit mode...')
        }
      } else {
        toast.error('Failed to create story')
      }
    } catch (error) {
      console.error('Create story error:', error)
      toast.error('Failed to create story')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProgressComplete = () => {
    if (currentStoryUniqueId && currentStoryId) {
      // Navigate to editor after RSS processing is complete
      // Use uniqueId in the URL path, and pass both storyId and uniqueId in state
      navigate(`/editor/${currentStoryUniqueId}`, {
        state: {
          storyId: currentStoryId,
          uniqueId: currentStoryUniqueId,
          fromCreate: true,
          isDynamic: true,
        },
      })
    }
    setShowProgressLoader(false)
    setCurrentStoryId(null)
    setCurrentStoryUniqueId(null)
  }

  const handleProgressError = () => {
    setShowProgressLoader(false)
    setCurrentStoryId(null)
    setCurrentStoryUniqueId(null)
    toast.error('RSS processing failed. You can still edit the story manually.')
  }

  const FileUpload = ({
    label,
    onFileSelect,
    previewUrl,
    accept = 'image/*',
  }: {
    label: string
    onFileSelect: (file: File) => void
    previewUrl?: string
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
          disabled={isLoading}
        >
          <Upload className="h-4 w-4" />
          <span>{isLoading ? 'Uploading...' : 'Upload'}</span>
        </Button>
        {previewUrl && (
          <div className="flex items-center space-x-2">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-8 w-8 rounded object-cover"
            />
            <span className="text-sm text-muted-foreground">Uploaded</span>
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

  return (
    <div className="flex h-full flex-col">
      {/* Main Content */}
      <div className="flex flex-1 space-x-6 overflow-hidden">
        {/* Left Panel - Configuration */}
        <div className="flex-1 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Create Snap</h2>
            <p className="text-muted-foreground">
              Configure your web story settings
            </p>
          </div>

          {/* Snap Name */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the name for your snap</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="snap-name">Snap Name</Label>
                <Input
                  id="snap-name"
                  placeholder="Enter your snap name"
                  value={snapData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
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
                  Select which advertiser this story belongs to
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
                              setSnapData((prev) => ({
                                ...prev,
                                userId: advertiser.id,
                              }))
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
                            setSnapData((prev) => ({
                              ...prev,
                              userId: undefined,
                            }))
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

          {/* Story Type Selection */}
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
                      <div className="max-w-xs space-y-2">
                        <p className="font-semibold">Static Story:</p>
                        <p className="text-sm">
                          Create frames manually. Content doesn't change
                          automatically.
                        </p>
                        <p className="font-semibold">Dynamic Story:</p>
                        <p className="text-sm">
                          Automatically updates from RSS feed at specified
                          intervals.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Choose whether your story will be static or dynamic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={snapData.storyType}
                onValueChange={handleStoryTypeChange}
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
            </CardContent>
          </Card>

          {/* RSS Configuration - Only show for dynamic stories */}
          {snapData.storyType === 'dynamic' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rss className="h-5 w-5" />
                  RSS Configuration
                </CardTitle>
                <CardDescription>
                  Configure RSS feed settings for automatic updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rss-url">RSS Feed URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="rss-url"
                      placeholder="https://example.com/feed.xml"
                      value={rssConfig.feedUrl}
                      onChange={(e) =>
                        handleRssConfigChange('feedUrl', e.target.value)
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateRSSFeed}
                      disabled={isValidatingFeed}
                    >
                      {isValidatingFeed ? 'Validating...' : 'Validate'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="update-interval">
                      Update Interval (minutes)
                    </Label>
                    <Input
                      id="update-interval"
                      type="number"
                      min="5"
                      max="1440"
                      value={rssConfig.updateIntervalMinutes}
                      onChange={(e) =>
                        handleRssConfigChange(
                          'updateIntervalMinutes',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-posts">Max Posts</Label>
                    <Input
                      id="max-posts"
                      type="number"
                      min="1"
                      max="50"
                      value={rssConfig.maxPosts}
                      onChange={(e) =>
                        handleRssConfigChange(
                          'maxPosts',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="allow-repetition"
                    checked={rssConfig.allowRepetition}
                    onCheckedChange={(checked) =>
                      handleRssConfigChange('allowRepetition', checked)
                    }
                  />
                  <Label htmlFor="allow-repetition">
                    Allow repetition to reach max posts
                  </Label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ad Insertion Configuration - Only show for dynamic stories */}
          {snapData.storyType === 'dynamic' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Ad Configuration
                </CardTitle>
                <CardDescription>
                  Configure how and where ads should be automatically inserted
                  in your dynamic story
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ad Insertion Strategy</Label>
                  <RadioGroup
                    value={rssConfig.adInsertionConfig?.strategy || 'start-end'}
                    onValueChange={(value) => {
                      const strategy = value as AdInsertionConfig['strategy']
                      handleRssConfigChange('adInsertionConfig', {
                        strategy,
                        ...(strategy === 'interval'
                          ? {
                              interval:
                                rssConfig.adInsertionConfig?.interval || 3,
                              intervalPosition:
                                rssConfig.adInsertionConfig?.intervalPosition ||
                                'after',
                            }
                          : {}),
                      } as AdInsertionConfig)
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

                {rssConfig.adInsertionConfig?.strategy === 'interval' && (
                  <div className="space-y-4 rounded-md border p-4">
                    <div className="space-y-2">
                      <Label htmlFor="ad-interval">Number of Posts (N)</Label>
                      <Input
                        id="ad-interval"
                        type="number"
                        min="1"
                        value={rssConfig.adInsertionConfig?.interval || 3}
                        onChange={(e) =>
                          handleRssConfigChange('adInsertionConfig', {
                            ...rssConfig.adInsertionConfig,
                            interval: Math.max(
                              1,
                              parseInt(e.target.value) || 3
                            ),
                          } as AdInsertionConfig)
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
                          rssConfig.adInsertionConfig?.intervalPosition ||
                          'after'
                        }
                        onValueChange={(value) =>
                          handleRssConfigChange('adInsertionConfig', {
                            ...rssConfig.adInsertionConfig,
                            intervalPosition:
                              value as AdInsertionConfig['intervalPosition'],
                          } as AdInsertionConfig)
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
                    value={snapData.format}
                    onValueChange={handleFormatChange}
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
                    value={snapData.deviceFrame}
                    onValueChange={handleDeviceFrameChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device frame" />
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
                    snapData.cpm !== null && snapData.cpm !== undefined
                      ? String(snapData.cpm)
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
                Set publisher details for your snap
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publisher-name">Publisher Name</Label>
                <Input
                  id="publisher-name"
                  placeholder="Enter publisher name"
                  value={snapData.publisher.name}
                  onChange={(e) =>
                    handlePublisherChange('name', e.target.value)
                  }
                />
              </div>
              <FileUpload
                label="Publisher Profile Picture"
                onFileSelect={(file) => handlePublisherPicUpload(file)}
                previewUrl={previewUrls.publisherPic}
              />
            </CardContent>
          </Card>

          {/* Story Configuration (thumbnails removed) */}
          <Card>
            <CardHeader>
              <CardTitle>Story Configuration</CardTitle>
              <CardDescription>
                Set default settings for your story
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
                        (snapData.defaultDurationMs || 2500) === ms
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        setSnapData((prev) => ({
                          ...prev,
                          defaultDurationMs: ms,
                        }))
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
                        (snapData.defaultDurationMs || 2500) / 1000
                      )}
                      onChange={(e) =>
                        setSnapData((prev) => ({
                          ...prev,
                          defaultDurationMs:
                            Math.max(1, Number(e.target.value) || 5) * 1000,
                        }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      seconds
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Used for all new frames by default. Frames can override this
                  in editor.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CTA removed: story-level CTA is no longer supported */}
        </div>

        {/* Right Panel - Mobile Preview */}
        <div className="w-124 flex-shrink-0 px-4">
          <div className="sticky flex h-full flex-col items-center justify-center">
            <StoryFrame
              publisherName={snapData.publisher.name}
              storyTitle={snapData.name}
              publisherPic={previewUrls.publisherPic}
              mainContent={undefined}
              currentSlide={1}
              totalSlides={4}
              showProgressBar={true}
              isEditMode={false}
              format={snapData.format}
              deviceFrame={snapData.deviceFrame}
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar - Static */}
      <div className="border-t bg-background px-6 py-3">
        <div className="flex justify-end space-x-4">
          <Button
            onClick={handleSaveAndEdit}
            className="flex items-center space-x-2"
            disabled={isLoading}
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Saving...' : 'Save & Edit'}</span>
          </Button>
        </div>
      </div>

      {/* RSS Progress Loader */}
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

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
import { Upload, Save, Info, Rss, Smartphone, Monitor } from 'lucide-react'
import { storyAPI, uploadAPI, rssAPI } from '@/lib/api'
import RSSProgressLoader from '@/components/RSSProgressLoader'
import { Story } from '@snappy/shared-types'
import StoryFrame from '@/components/StoryFrame'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function EditStoryPage() {
  const navigate = useNavigate()
  const { uniqueId } = useParams()
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showProgressLoader, setShowProgressLoader] = useState(false)
  const [originalRSSConfig, setOriginalRSSConfig] = useState<any | null>(null)
  const [applyDefaultToAll, setApplyDefaultToAll] = useState(false)

  // Load story data
  useEffect(() => {
    if (uniqueId) {
      loadStory()
    }
  }, [uniqueId])

  const loadStory = async () => {
    try {
      setIsLoading(true)
      const response = await storyAPI.getStoryByUniqueId(uniqueId!)

      if (response.success && response.data) {
        setStory(response.data)
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

  const handleInputChange = (field: string, value: string) => {
    if (!story) return

    setStory((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
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

      const response = await storyAPI.updateStory(story.id, {
        title: story.title,
        publisherName: story.publisherName,
        publisherPic: story.publisherPic,
        ctaType: story.ctaType || undefined,
        ctaValue: story.ctaValue || undefined,
        ctaText: story.ctaText || undefined,
        format: story.format || 'portrait',
        deviceFrame: story.deviceFrame || 'mobile',
        storyType: story.storyType || 'static',
        rssConfig:
          story.storyType === 'dynamic'
            ? (story as any).rssConfig || undefined
            : null,
      })

      if (response.success) {
        toast.success('Story updated successfully!')

        // If dynamic and RSS config changed, trigger update and show progress modal
        const isDynamic = story.storyType === 'dynamic'
        const currentRSS: any = (story as any).rssConfig || null
        const rssChanged =
          isDynamic && hasRSSConfigChanged(originalRSSConfig, currentRSS)

        if (isDynamic && rssChanged) {
          try {
            // Trigger RSS processing for the updated config
            await rssAPI.triggerRSSUpdate(story.id)
          } catch (e) {
            // Even if trigger fails, still show the modal to poll status (backend may have auto-triggered)
            console.error('Failed to trigger RSS update explicitly:', e)
          }

          setShowProgressLoader(true)
        } else {
          navigate(`/editor/${story.uniqueId}`, {
            state: {
              storyId: story.id,
              uniqueId: story.uniqueId,
              fromCreate: false,
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

  // Helper: compare RSS config changes
  const hasRSSConfigChanged = (
    originalCfg: any | null,
    currentCfg: any | null
  ) => {
    const o = originalCfg || {}
    const c = currentCfg || {}
    return (
      o.feedUrl !== c.feedUrl ||
      Number(o.updateIntervalMinutes ?? 0) !==
        Number(c.updateIntervalMinutes ?? 0) ||
      Number(o.maxPosts ?? 0) !== Number(c.maxPosts ?? 0) ||
      Boolean(o.allowRepetition) !== Boolean(c.allowRepetition) ||
      Boolean(o.isActive) !== Boolean(c.isActive)
    )
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
                <div className="flex items-center gap-2">
                  <input
                    id="apply-default-all"
                    type="checkbox"
                    className="h-4 w-4"
                    checked={applyDefaultToAll}
                    onChange={(e) => setApplyDefaultToAll(e.target.checked)}
                  />
                  <Label htmlFor="apply-default-all" className="m-0">
                    Apply to all frames (override existing)
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card>
            <CardHeader>
              <CardTitle>Call to Action</CardTitle>
              <CardDescription>
                Configure the action users will take
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cta-type">CTA Type</Label>
                <Select
                  value={story.ctaType || 'none'}
                  onValueChange={(value) =>
                    handleInputChange(
                      'ctaType',
                      value === 'none' ? null : (value as any)
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CTA type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No CTA</SelectItem>
                    <SelectItem value="redirect">Redirect to URL</SelectItem>
                    <SelectItem value="form">Open a Form</SelectItem>
                    <SelectItem value="promo">Give a Promo Code</SelectItem>
                    <SelectItem value="sell">Sell an Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {story.ctaType && (
                <div className="space-y-2">
                  <Label htmlFor="cta-value">
                    {story.ctaType === 'redirect' && 'URL'}
                    {story.ctaType === 'form' && 'Form Name'}
                    {story.ctaType === 'promo' && 'Promo Code'}
                    {story.ctaType === 'sell' && 'Product Name'}
                  </Label>
                  <Input
                    id="cta-value"
                    placeholder={
                      story.ctaType === 'redirect'
                        ? 'https://example.com'
                        : story.ctaType === 'form'
                          ? 'Contact Form'
                          : story.ctaType === 'promo'
                            ? 'SAVE20'
                            : 'Product Name'
                    }
                    value={story.ctaValue || ''}
                    onChange={(e) =>
                      handleInputChange('ctaValue', e.target.value)
                    }
                  />
                </div>
              )}
              {story.ctaType && (
                <div className="space-y-2">
                  <Label htmlFor="cta-text">CTA Button Text</Label>
                  <Input
                    id="cta-text"
                    placeholder={
                      story.ctaType === 'redirect'
                        ? 'Visit Link'
                        : story.ctaType === 'form'
                          ? 'Fill Form'
                          : story.ctaType === 'promo'
                            ? 'Get Promo'
                            : 'Buy Now'
                    }
                    value={story.ctaText || ''}
                    onChange={(e) =>
                      handleInputChange('ctaText', e.target.value)
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default text
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Mobile Preview */}
        <div className="w-124 flex-shrink-0 px-4">
          <div className="sticky flex h-full flex-col items-center justify-center">
            <StoryFrame
              publisherName={story.publisherName}
              storyTitle={story.title}
              publisherPic={story.publisherPic}
              mainContent={story.largeThumbnail}
              ctaType={story.ctaType}
              ctaValue={story.ctaValue}
              ctaText={story.ctaText}
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
      {showProgressLoader && story?.id && (
        <RSSProgressLoader
          storyId={story.id}
          onComplete={() => {
            setShowProgressLoader(false)
            // Refresh original snapshot to new config
            setOriginalRSSConfig((story as any).rssConfig || null)
            navigate(`/editor/${story.uniqueId}`, {
              state: {
                storyId: story.id,
                uniqueId: story.uniqueId,
                fromCreate: false,
                isDynamic: true,
              },
            })
          }}
          onError={() => {
            setShowProgressLoader(false)
            toast.error(
              'RSS processing failed. You can still edit the story manually.'
            )
            navigate(`/editor/${story.uniqueId}`, {
              state: {
                storyId: story.id,
                uniqueId: story.uniqueId,
                fromCreate: false,
                isDynamic: true,
              },
            })
          }}
        />
      )}
    </div>
  )
}

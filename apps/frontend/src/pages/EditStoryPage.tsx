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
import { Badge } from '@/components/ui/badge'
import { Upload, Save } from 'lucide-react'
import { storyAPI, uploadAPI } from '@/lib/api'
import { Story } from '@snappy/shared-types'
import StoryFrame from '@/components/StoryFrame'

export default function EditStoryPage() {
  const navigate = useNavigate()
  const { uniqueId } = useParams()
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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

  const handleFileUpload = async (
    type: 'publisherPic' | 'largeThumbnail' | 'smallThumbnail',
    file: File
  ) => {
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
                [type === 'publisherPic' ? 'publisherPic' : type]: url,
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
        largeThumbnail: story.largeThumbnail,
        smallThumbnail: story.smallThumbnail,
        ctaType: story.ctaType,
        ctaValue: story.ctaValue,
      })

      if (response.success) {
        toast.success('Story updated successfully!')
        navigate(`/editor/${story.uniqueId}`, {
          state: {
            storyId: story.id,
            uniqueId: story.uniqueId,
            fromCreate: false,
          },
        })
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
        <div className="flex-1 space-y-6 overflow-y-auto">
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
                onFileSelect={(file) => handleFileUpload('publisherPic', file)}
                currentUrl={story.publisherPic}
              />
            </CardContent>
          </Card>

          {/* Story Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Story Configuration</CardTitle>
              <CardDescription>
                Update thumbnails for your story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                label="Large Thumbnail"
                onFileSelect={(file) =>
                  handleFileUpload('largeThumbnail', file)
                }
                currentUrl={story.largeThumbnail}
              />
              <FileUpload
                label="Small Thumbnail"
                onFileSelect={(file) =>
                  handleFileUpload('smallThumbnail', file)
                }
                currentUrl={story.smallThumbnail}
              />
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
                  value={story.ctaType || ''}
                  onValueChange={(value) => handleInputChange('ctaType', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select CTA type" />
                  </SelectTrigger>
                  <SelectContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Mobile Preview */}
        <div className="w-96 flex-shrink-0 px-4">
          <div className="sticky flex h-full flex-col items-center justify-center">
            <StoryFrame
              publisherName={story.publisherName}
              storyTitle={story.title}
              publisherPic={story.publisherPic}
              mainContent={story.largeThumbnail}
              ctaType={story.ctaType}
              currentSlide={1}
              totalSlides={4}
              showProgressBar={true}
              isEditMode={false}
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar - Static */}
      <div className="border-t bg-background px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{story.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Last updated: {new Date(story.updatedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex space-x-4">
            <Button variant="outline">Save Draft</Button>
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
    </div>
  )
}

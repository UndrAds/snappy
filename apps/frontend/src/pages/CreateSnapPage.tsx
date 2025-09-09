import { useState } from 'react'
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
import { Upload, Save, Smartphone, Monitor } from 'lucide-react'
import { toast } from 'sonner'
import StoryFrame from '@/components/StoryFrame'
import { storyAPI, uploadAPI } from '@/lib/api'
import type { StoryFormat, DeviceFrame } from '@snappy/shared-types'

interface SnapData {
  name: string
  publisher: {
    name: string
    profilePic: File | null
  }
  thumbnails: {
    large: File | null
    small: File | null
  }
  cta: {
    type: 'redirect' | 'form' | 'promo' | 'sell' | null
    value: string
  }
  format: StoryFormat
  deviceFrame: DeviceFrame
}

export default function CreateSnapPage() {
  const defaultPublisherPic =
    'https://ui-avatars.com/api/?name=John+Doe&background=random'
  const defaultLargeThumbnail =
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80'
  const defaultSmallThumbnail =
    'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=200&q=80'

  const navigate = useNavigate()
  const [snapData, setSnapData] = useState<SnapData>({
    name: 'My Amazing Story',
    publisher: {
      name: 'John Doe',
      profilePic: null, // File upload will still work, but preview will use default
    },
    thumbnails: {
      large: null,
      small: null,
    },
    cta: {
      type: null,
      value: '',
    },
    format: 'portrait' as const,
    deviceFrame: 'mobile' as const,
  })

  const [previewUrls, setPreviewUrls] = useState<{
    publisherPic?: string
    largeThumbnail?: string
    smallThumbnail?: string
  }>({
    publisherPic: defaultPublisherPic,
    largeThumbnail: defaultLargeThumbnail,
    smallThumbnail: defaultSmallThumbnail,
  })

  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (field: string, value: string) => {
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

  const handleFileUpload = async (
    type: 'publisherPic' | 'largeThumbnail' | 'smallThumbnail',
    file: File
  ) => {
    try {
      setIsLoading(true)

      // Upload file to backend
      const response = await uploadAPI.uploadSingle(file)

      if (response.success && response.data) {
        const url = response.data.url
        setPreviewUrls((prev) => ({
          ...prev,
          [type]: url,
        }))

        if (type === 'publisherPic') {
          setSnapData((prev) => ({
            ...prev,
            publisher: {
              ...prev.publisher,
              profilePic: file,
            },
          }))
        } else {
          setSnapData((prev) => ({
            ...prev,
            thumbnails: {
              ...prev.thumbnails,
              [type === 'largeThumbnail' ? 'large' : 'small']: file,
            },
          }))
        }

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

  const handleCtaChange = (type: string, value: string) => {
    setSnapData((prev) => ({
      ...prev,
      cta: {
        type:
          type === 'none'
            ? null
            : (type as 'redirect' | 'form' | 'promo' | 'sell' | null),
        value: type === 'none' ? '' : value,
      },
    }))
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
    if (!snapData.thumbnails.large && !previewUrls.largeThumbnail) {
      toast.error('Please upload a large thumbnail')
      return
    }
    if (!snapData.thumbnails.small && !previewUrls.smallThumbnail) {
      toast.error('Please upload a small thumbnail')
      return
    }
    if (snapData.cta.type && !snapData.cta.value.trim()) {
      toast.error('Please enter a CTA value')
      return
    }

    try {
      setIsLoading(true)

      // Create story in backend
      const storyResponse = await storyAPI.createStory({
        title: snapData.name,
        publisherName: snapData.publisher.name,
        publisherPic: previewUrls.publisherPic,
        largeThumbnail: previewUrls.largeThumbnail,
        smallThumbnail: previewUrls.smallThumbnail,
        ctaType: snapData.cta.type || undefined,
        ctaValue: snapData.cta.value || undefined,
        format: snapData.format,
        deviceFrame: snapData.deviceFrame,
      })

      if (storyResponse.success && storyResponse.data) {
        // Prepare the data to pass to editor
        const editorData = {
          storyTitle: snapData.name,
          publisherName: snapData.publisher.name,
          publisherPic: previewUrls.publisherPic,
          thumbnail: previewUrls.largeThumbnail, // This is the thumbnail for preview
          background: previewUrls.largeThumbnail, // This becomes the background of the story
          ctaType: snapData.cta.type || undefined,
          ctaValue: snapData.cta.value || undefined,
          format: snapData.format,
          deviceFrame: snapData.deviceFrame,
        }

        // Navigate to editor with the data
        navigate(`/editor/${storyResponse.data.uniqueId}`, {
          state: {
            storyData: editorData,
            storyId: storyResponse.data.id,
            uniqueId: storyResponse.data.uniqueId,
            fromCreate: true,
          },
        })

        toast.success('Snap saved successfully! Moving to edit mode...')
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
        <div className="flex-1 space-y-6 overflow-y-auto">
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
                          <div className="h-4 w-3 rounded bg-gray-300"></div>
                          <span>Portrait (9:16)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="landscape">
                        <div className="flex items-center space-x-2">
                          <div className="h-3 w-4 rounded bg-gray-300"></div>
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
                onFileSelect={(file) => handleFileUpload('publisherPic', file)}
                previewUrl={previewUrls.publisherPic}
              />
            </CardContent>
          </Card>

          {/* Story Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Story Configuration</CardTitle>
              <CardDescription>
                Upload thumbnails for your story
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUpload
                label="Large Thumbnail"
                onFileSelect={(file) =>
                  handleFileUpload('largeThumbnail', file)
                }
                previewUrl={previewUrls.largeThumbnail}
              />
              <FileUpload
                label="Small Thumbnail"
                onFileSelect={(file) =>
                  handleFileUpload('smallThumbnail', file)
                }
                previewUrl={previewUrls.smallThumbnail}
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
                  value={snapData.cta.type || 'none'}
                  onValueChange={(value) =>
                    handleCtaChange(value, snapData.cta.value)
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
              {snapData.cta.type && (
                <div className="space-y-2">
                  <Label htmlFor="cta-value">
                    {snapData.cta.type === 'redirect' && 'URL'}
                    {snapData.cta.type === 'form' && 'Form Name'}
                    {snapData.cta.type === 'promo' && 'Promo Code'}
                    {snapData.cta.type === 'sell' && 'Product Name'}
                  </Label>
                  <Input
                    id="cta-value"
                    placeholder={
                      snapData.cta.type === 'redirect'
                        ? 'https://example.com'
                        : snapData.cta.type === 'form'
                          ? 'Contact Form'
                          : snapData.cta.type === 'promo'
                            ? 'SAVE20'
                            : 'Product Name'
                    }
                    value={snapData.cta.value}
                    onChange={(e) =>
                      handleCtaChange(snapData.cta.type!, e.target.value)
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
              publisherName={snapData.publisher.name}
              storyTitle={snapData.name}
              publisherPic={previewUrls.publisherPic}
              mainContent={previewUrls.largeThumbnail}
              ctaType={snapData.cta.type}
              ctaValue={snapData.cta.value}
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
          <Button variant="outline">Save Draft</Button>
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
    </div>
  )
}

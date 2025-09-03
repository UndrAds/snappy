import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Globe, Image, Type, Play, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { contentAPI } from '@/lib/api'

interface ScrapedContent {
  headlines: string[]
  images: Array<{
    url: string
    alt: string
    width?: number
    height?: number
  }>
  title: string
  description?: string
}

interface SelectedContent {
  headlines: string[]
  backgroundImage: string
  backgroundImageAlt: string
}

interface AutomatedStoryCreatorProps {
  onContentSelected: (content: SelectedContent) => void
  onClose: () => void
}

export default function AutomatedStoryCreator({
  onContentSelected,
  onClose,
}: AutomatedStoryCreatorProps) {
  const [url, setUrl] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapedContent, setScrapedContent] = useState<ScrapedContent | null>(
    null
  )
  const [selectedHeadlines, setSelectedHeadlines] = useState<string[]>([])
  const [selectedBackgroundImage, setSelectedBackgroundImage] =
    useState<string>('')
  const [selectedBackgroundImageAlt, setSelectedBackgroundImageAlt] =
    useState('')

  const handleScrape = async () => {
    if (!url.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    try {
      setIsScraping(true)
      const response = await contentAPI.scrapeWebsite(url.trim())

      if (response.success && response.data) {
        setScrapedContent(response.data)
        toast.success('Content scraped successfully!')
      } else {
        toast.error('Failed to scrape content')
      }
    } catch (error) {
      console.error('Scraping error:', error)
      toast.error(
        'Failed to scrape website. Please check the URL and try again.'
      )
    } finally {
      setIsScraping(false)
    }
  }

  const handleHeadlineToggle = (headline: string) => {
    setSelectedHeadlines((prev) =>
      prev.includes(headline)
        ? prev.filter((h) => h !== headline)
        : [...prev, headline]
    )
  }

  const handleBackgroundImageSelect = (imageUrl: string, alt: string) => {
    setSelectedBackgroundImage(imageUrl)
    setSelectedBackgroundImageAlt(alt)
  }

  const handleCreateStory = () => {
    if (selectedHeadlines.length === 0) {
      toast.error('Please select at least one headline')
      return
    }

    if (!selectedBackgroundImage) {
      toast.error('Please select a background image')
      return
    }

    onContentSelected({
      headlines: selectedHeadlines,
      backgroundImage: selectedBackgroundImage,
      backgroundImageAlt: selectedBackgroundImageAlt,
    })
  }

  const canCreateStory = selectedHeadlines.length > 0 && selectedBackgroundImage

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-auto max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold">Automated Story Creator</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6 p-6">
          {/* URL Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">
              Website URL
            </label>
            <div className="flex gap-3">
              <Input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleScrape}
                disabled={isScraping || !url.trim()}
                className="min-w-[120px]"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Scrape
                  </>
                )}
              </Button>
            </div>
          </div>

          {scrapedContent && (
            <div className="space-y-6">
              {/* Website Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Website Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <span className="font-medium">Title:</span>{' '}
                    {scrapedContent.title}
                  </div>
                  {scrapedContent.description && (
                    <div>
                      <span className="font-medium">Description:</span>{' '}
                      {scrapedContent.description}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Tabs defaultValue="headlines" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="headlines"
                    className="flex items-center gap-2"
                  >
                    <Type className="h-4 w-4" />
                    Headlines ({scrapedContent.headlines.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="images"
                    className="flex items-center gap-2"
                  >
                    <Image className="h-4 w-4" />
                    Images ({scrapedContent.images.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="headlines" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Headlines for Story Frames</CardTitle>
                      <p className="text-sm text-gray-600">
                        Choose the headlines you want to include in your story.
                        Each selected headline will become a story frame.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid max-h-64 gap-3 overflow-y-auto">
                        {scrapedContent.headlines.map((headline, index) => (
                          <div
                            key={index}
                            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                              selectedHeadlines.includes(headline)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleHeadlineToggle(headline)}
                          >
                            <div className="flex items-start justify-between">
                              <p className="text-sm">{headline}</p>
                              {selectedHeadlines.includes(headline) && (
                                <Check className="ml-2 h-4 w-4 flex-shrink-0 text-blue-600" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedHeadlines.length > 0 && (
                        <div className="mt-4 rounded-lg bg-blue-50 p-3">
                          <p className="text-sm font-medium text-blue-800">
                            Selected: {selectedHeadlines.length} headline
                            {selectedHeadlines.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="images" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Background Image</CardTitle>
                      <p className="text-sm text-gray-600">
                        Choose one image to use as the background for all story
                        frames. The image will have motion effects applied.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid max-h-64 grid-cols-2 gap-4 overflow-y-auto md:grid-cols-3">
                        {scrapedContent.images.map((image, index) => (
                          <div
                            key={index}
                            className={`relative cursor-pointer rounded-lg border transition-all hover:scale-105 ${
                              selectedBackgroundImage === image.url
                                ? 'border-blue-500 ring-2 ring-blue-500'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() =>
                              handleBackgroundImageSelect(image.url, image.alt)
                            }
                          >
                            <img
                              src={image.url}
                              alt={image.alt}
                              className="h-32 w-full rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                            {selectedBackgroundImage === image.url && (
                              <div className="absolute right-2 top-2">
                                <Badge className="bg-blue-600 text-white">
                                  <Check className="mr-1 h-3 w-3" />
                                  Selected
                                </Badge>
                              </div>
                            )}
                            <div className="p-2">
                              <p className="truncate text-xs text-gray-600">
                                {image.alt || 'No description'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {selectedBackgroundImage && (
                        <div className="mt-4 rounded-lg bg-green-50 p-3">
                          <p className="text-sm font-medium text-green-800">
                            Background image selected
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Create Story Button */}
              <div className="flex justify-end border-t pt-4">
                <Button
                  onClick={handleCreateStory}
                  disabled={!canCreateStory}
                  className="min-w-[150px]"
                >
                  <Play className="mr-2 h-4 w-4" />
                  Create Story ({selectedHeadlines.length} frames)
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

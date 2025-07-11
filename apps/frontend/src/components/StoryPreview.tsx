import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Smartphone } from 'lucide-react'

interface StoryPreviewProps {
  publisherName: string
  storyTitle: string
  publisherPic?: string
  mainContent?: string
  ctaType?: 'redirect' | 'form' | 'promo' | 'sell' | null
  currentSlide?: number
  totalSlides?: number
  showProgressBar?: boolean
}

export default function StoryPreview({
  publisherName,
  storyTitle,
  publisherPic,
  mainContent,
  ctaType,
  currentSlide = 1,
  totalSlides = 4,
  showProgressBar = true,
}: StoryPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5" />
          <span>Mobile Preview</span>
        </CardTitle>
        <CardDescription>How your story will appear on mobile</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mx-auto h-[550px] w-72 overflow-hidden rounded-[3rem] border-8 border-gray-400 bg-gray-200 shadow-2xl">
          {/* Mobile Frame Content */}
          <div className="h-full w-full overflow-hidden bg-black">
            {/* Story Progress Bar */}
            {showProgressBar && (
              <div className="absolute left-4 right-4 top-4 z-10">
                <div className="flex space-x-1">
                  {Array.from({ length: totalSlides }, (_, index) => (
                    <div
                      key={index}
                      className="h-1 flex-1 rounded-full bg-white/30"
                    >
                      <div
                        className="h-full rounded-full bg-white transition-all duration-300"
                        style={{
                          width:
                            index < currentSlide
                              ? '100%'
                              : index === currentSlide - 1
                                ? '25%'
                                : '0%',
                        }}
                      ></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Header */}
            <div className="absolute left-4 right-4 top-8 z-10">
              <div className="flex items-center space-x-3">
                {publisherPic ? (
                  <img
                    src={publisherPic}
                    alt="Publisher"
                    className="h-8 w-8 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white/20">
                    <span className="text-xs text-white">PP</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">
                    {publisherName || 'Publisher Name'}
                  </div>
                  <div className="text-xs text-white/80">
                    {storyTitle || 'Story Title'}
                  </div>
                </div>
                <div className="text-xs text-white">
                  {currentSlide}/{totalSlides}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex h-full w-full items-center justify-center">
              {mainContent ? (
                <img
                  src={mainContent}
                  alt="Story content"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                  <div className="text-center text-white">
                    <div className="mb-6 text-6xl">📱</div>
                    <div className="mb-3 text-xl font-bold">
                      {storyTitle || 'Your Story'}
                    </div>
                    <div className="text-sm opacity-90">
                      Upload content to see preview
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom CTA (if configured) */}
            {ctaType && (
              <div className="absolute bottom-8 left-4 right-4 z-10">
                <div className="rounded-full bg-white/90 px-6 py-3 text-center backdrop-blur-sm">
                  <div className="text-sm font-semibold text-black">
                    {ctaType === 'redirect' && 'Visit Link'}
                    {ctaType === 'form' && 'Fill Form'}
                    {ctaType === 'promo' && 'Get Promo'}
                    {ctaType === 'sell' && 'Buy Now'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

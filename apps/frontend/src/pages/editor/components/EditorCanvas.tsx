import { Button } from '@/components/ui/button'
import { Type, Image } from 'lucide-react'
import { toast } from 'sonner'
import StoryFrame from '@/components/StoryFrame'
import type { StoryFormat, DeviceFrame } from '@snappy/shared-types'

interface CanvasElement {
  id: string
  type: 'text' | 'image' | 'shape'
  x: number
  y: number
  width: number
  height: number
  content?: string
  mediaUrl?: string
  style: {
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    color?: string
    backgroundColor?: string
    opacity?: number
    rotation?: number
    brightness?: number
    contrast?: number
    saturation?: number
    sharpness?: number
    highlights?: number
    filter?: string
  }
}

interface StoryData {
  storyTitle: string
  publisherName: string
  publisherPic?: string
  thumbnail?: string
  background?: string
  ctaType: 'redirect' | 'form' | 'promo' | 'sell' | null
  ctaValue: string
  ctaText?: string
  format?: StoryFormat
  deviceFrame?: DeviceFrame
}

interface EditorCanvasProps {
  elements: CanvasElement[]
  frameType?: 'story' | 'ad'
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
  }
  adConfig?: {
    adId: string
    adUnitPath?: string
    size?: [number, number]
  }
  link?: string // Optional link URL for the frame
  linkText?: string // Optional link label for the frame
  onElementSelect: (elementId: string) => void
  onBackgroundSelect?: () => void
  onElementUpdate: (elementId: string, updates: Partial<CanvasElement>) => void
  onElementAdd: (element: CanvasElement) => void
  onElementRemove: (elementId: string) => void
  selectedElementId?: string
  storyData?: StoryData
  currentSlide?: number
  totalSlides?: number
  format?: StoryFormat
  deviceFrame?: DeviceFrame
}

export default function EditorCanvas({
  elements,
  frameType = 'story',
  background,
  adConfig,
  link,
  linkText,
  onElementSelect,
  onBackgroundSelect,
  onElementUpdate,
  onElementAdd,
  onElementRemove,
  selectedElementId,
  storyData,
  currentSlide,
  totalSlides,
  format = 'portrait',
  deviceFrame = 'mobile',
}: EditorCanvasProps) {
  const handleAddElement = (type: 'text' | 'image') => {
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type,
      x: 50,
      y: 50,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 60 : 150,
      content: type === 'text' ? 'Double click to edit' : undefined,
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: 'transparent',
        opacity: 100,
        rotation: 0,
        brightness: 50,
        contrast: 50,
        saturation: 50,
        sharpness: 50,
        highlights: 50,
        filter: 'none',
      },
    }

    onElementAdd(newElement)
    onElementSelect(newElement.id)
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} element added!`
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 p-8">
      <div className="relative">
        {/* Canvas Title */}
        <div className="mb-4 text-center">
          {currentSlide && totalSlides && (
            <span className="block text-xs text-green-600">
              Story {currentSlide} of {totalSlides}
            </span>
          )}
        </div>

        {/* Story Frame */}
        <StoryFrame
          isEditMode={true}
          frameType={frameType}
          elements={elements}
          background={background}
          adConfig={adConfig}
          link={link}
          linkText={linkText}
          selectedElementId={selectedElementId}
          onElementSelect={onElementSelect}
          onElementUpdate={onElementUpdate}
          onElementRemove={onElementRemove}
          onBackgroundSelect={onBackgroundSelect}
          storyTitle={storyData?.storyTitle}
          publisherName={storyData?.publisherName}
          publisherPic={storyData?.publisherPic}
          mainContent={storyData?.thumbnail} // Use thumbnail as main content for preview
          ctaType={storyData?.ctaType}
          ctaValue={storyData?.ctaValue}
          ctaText={storyData?.ctaText}
          showPublisherInfo={true}
          showCTA={true}
          showProgressBar={true}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
          format={format}
          deviceFrame={deviceFrame}
        />

        {/* Quick Add Elements - Alternative to the buttons inside the frame */}
        <div className="mt-4 flex justify-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddElement('text')}
            className="flex items-center space-x-2"
          >
            <Type className="h-4 w-4" />
            <span>Add Text</span>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAddElement('image')}
            className="flex items-center space-x-2"
          >
            <Image className="h-4 w-4" />
            <span>Add Image</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

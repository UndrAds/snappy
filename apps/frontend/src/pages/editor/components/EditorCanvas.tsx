import { Button } from '@/components/ui/button'
import { Type, Image, Shapes } from 'lucide-react'
import { toast } from 'sonner'
import StoryFrame from '@/components/StoryFrame'

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
  mainContent?: string
  ctaType: 'redirect' | 'form' | 'promo' | 'sell' | null
  ctaValue: string
}

interface EditorCanvasProps {
  elements: CanvasElement[]
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
  }
  onElementSelect: (elementId: string) => void
  onElementUpdate: (elementId: string, updates: Partial<CanvasElement>) => void
  onElementAdd: (element: CanvasElement) => void
  onElementRemove: (elementId: string) => void
  selectedElementId?: string
  storyData?: StoryData
  currentSlide?: number
  totalSlides?: number
}

export default function EditorCanvas({
  elements,
  background,
  onElementSelect,
  onElementUpdate,
  onElementAdd,
  onElementRemove,
  selectedElementId,
  storyData,
  currentSlide,
  totalSlides,
}: EditorCanvasProps) {
  const handleAddElement = (type: 'text' | 'image' | 'shape') => {
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
          elements={elements}
          background={background}
          selectedElementId={selectedElementId}
          onElementSelect={onElementSelect}
          onElementUpdate={onElementUpdate}
          onElementAdd={onElementAdd}
          onElementRemove={onElementRemove}
          storyTitle={storyData?.storyTitle}
          publisherName={storyData?.publisherName}
          publisherPic={storyData?.publisherPic}
          mainContent={storyData?.mainContent}
          ctaType={storyData?.ctaType}
          showPublisherInfo={true}
          showCTA={true}
          showProgressBar={true}
          currentSlide={currentSlide}
          totalSlides={totalSlides}
        />

        {/* Quick Add Elements - Alternative to the buttons inside the frame */}
        <div className="mt-4 flex justify-center space-x-2">
          <Button
            size="sm"
            onClick={() => handleAddElement('text')}
            className="flex items-center space-x-2"
          >
            <Type className="h-4 w-4" />
            <span>Add Text</span>
          </Button>
          <Button
            size="sm"
            onClick={() => handleAddElement('image')}
            className="flex items-center space-x-2"
          >
            <Image className="h-4 w-4" />
            <span>Add Image</span>
          </Button>
          <Button
            size="sm"
            onClick={() => handleAddElement('shape')}
            className="flex items-center space-x-2"
          >
            <Shapes className="h-4 w-4" />
            <span>Add Shape</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

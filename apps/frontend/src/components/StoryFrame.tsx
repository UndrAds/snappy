import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Image, X } from 'lucide-react'
import { toast } from 'sonner'

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

interface StoryFrameProps {
  // Preview mode props
  publisherName?: string
  storyTitle?: string
  publisherPic?: string
  mainContent?: string
  ctaType?: 'redirect' | 'form' | 'promo' | 'sell' | null
  currentSlide?: number
  totalSlides?: number
  showProgressBar?: boolean

  // Editor mode props
  isEditMode?: boolean
  elements?: CanvasElement[]
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
  }
  selectedElementId?: string
  onElementSelect?: (elementId: string) => void
  onElementUpdate?: (elementId: string, updates: Partial<CanvasElement>) => void
  onElementRemove?: (elementId: string) => void

  // Edit mode display options
  showPublisherInfo?: boolean
  showCTA?: boolean
}

export default function StoryFrame({
  // Preview mode props
  publisherName,
  storyTitle,
  publisherPic,
  mainContent,
  ctaType,
  currentSlide = 1,
  totalSlides = 4,
  showProgressBar = true,

  // Editor mode props
  isEditMode = false,
  elements = [],
  background,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementRemove,

  // Edit mode display options
  showPublisherInfo = false,
  showCTA = false,
}: StoryFrameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleElementClick = (elementId: string) => {
    if (!isEditMode) return
    onElementSelect?.(elementId)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isEditMode) return
    // If clicking on the canvas background, deselect
    if (e.target === e.currentTarget) {
      onElementSelect?.('')
    }
  }

  const handleElementDoubleClick = (element: CanvasElement) => {
    if (!isEditMode) return
    if (element.type === 'text') {
      const newContent = prompt('Enter text:', element.content)
      if (newContent !== null) {
        onElementUpdate?.(element.id, { content: newContent })
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isEditMode || !isDragging || !selectedElementId || !onElementUpdate)
      return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    const selectedElement = elements.find((el) => el.id === selectedElementId)
    if (selectedElement) {
      onElementUpdate(selectedElementId, {
        x: selectedElement.x + deltaX,
        y: selectedElement.y + deltaY,
      })
    }

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    if (!isEditMode) return
    setIsDragging(false)
  }

  const handleDeleteElement = (elementId: string, e: React.MouseEvent) => {
    if (!isEditMode) return
    e.stopPropagation()
    onElementRemove?.(elementId)
    toast.success('Element deleted!')
  }

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElementId === element.id
    const style = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.style.fontSize,
      fontFamily: element.style.fontFamily,
      fontWeight: element.style.fontWeight,
      color: element.style.color,
      backgroundColor: element.style.backgroundColor,
      opacity: (element.style.opacity || 100) / 100,
      transform: `rotate(${element.style.rotation}deg)`,
      cursor: isEditMode ? 'pointer' : 'default',
      border:
        isSelected && isEditMode
          ? '2px solid #3b82f6'
          : '1px solid transparent',
      filter: `brightness(${element.style.brightness}%) contrast(${element.style.contrast}%) saturate(${element.style.saturation}%)`,
    }

    return (
      <div
        key={element.id}
        style={style}
        onClick={() => handleElementClick(element.id)}
        onDoubleClick={() => handleElementDoubleClick(element)}
        onMouseDown={isEditMode ? (e) => handleMouseDown(e) : undefined}
        className={`${isSelected && isEditMode ? 'ring-2 ring-blue-500' : ''} group relative transition-all`}
      >
        {/* Delete Button - Only in edit mode */}
        {isSelected && isEditMode && (
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => handleDeleteElement(element.id, e)}
            className="absolute -right-2 -top-2 z-10 h-6 w-6 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {element.type === 'text' && (
          <div className="flex h-full w-full items-center justify-center p-2 text-center">
            {element.content}
          </div>
        )}

        {element.type === 'image' && element.mediaUrl && (
          <img
            src={element.mediaUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        )}

        {element.type === 'image' && !element.mediaUrl && (
          <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-gray-300 bg-gray-200">
            <Image className="h-8 w-8 text-gray-400" />
          </div>
        )}

        {element.type === 'shape' && (
          <div className="h-full w-full rounded"></div>
        )}
      </div>
    )
  }

  // Determine background style
  const getBackgroundStyle = () => {
    if (isEditMode && background) {
      if (background.type === 'color') {
        return { background: background.value }
      } else if (background.type === 'image') {
        return {
          backgroundImage: `url(${background.value})`,
          backgroundSize: 'cover',
        }
      }
    } else if (mainContent) {
      return { backgroundImage: `url(${mainContent})`, backgroundSize: 'cover' }
    } else {
      return {
        background:
          'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
      }
    }
    return {}
  }

  // Determine if we should show publisher info and CTA
  const shouldShowPublisherInfo =
    !isEditMode || (isEditMode && showPublisherInfo)
  const shouldShowCTA = !isEditMode || (isEditMode && showCTA)

  return (
    <div className="relative mx-auto h-[550px] w-72 overflow-hidden rounded-[3rem] border-8 border-gray-400 bg-gray-200 shadow-2xl">
      {/* Mobile Frame Content */}
      <div
        className="h-full w-full overflow-hidden bg-black"
        style={getBackgroundStyle()}
        ref={canvasRef}
        onClick={isEditMode ? handleCanvasClick : undefined}
        onMouseMove={isEditMode ? handleMouseMove : undefined}
        onMouseUp={isEditMode ? handleMouseUp : undefined}
      >
        {/* Story Progress Bar - Show in preview mode or when currentSlide/totalSlides are provided in edit mode */}
        {((!isEditMode && showProgressBar) ||
          (isEditMode && currentSlide && totalSlides)) && (
          <div className="absolute left-4 right-4 top-4 z-10">
            <div className="flex space-x-1">
              {Array.from({ length: totalSlides || 4 }, (_, index) => (
                <div
                  key={index}
                  className="h-1 flex-1 rounded-full bg-white/30"
                >
                  <div
                    className="h-full rounded-full bg-white transition-all duration-300"
                    style={{
                      width:
                        index < (currentSlide || 1)
                          ? '100%'
                          : index === (currentSlide || 1) - 1
                            ? '25%'
                            : '0%',
                    }}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header - Show in preview mode or when showPublisherInfo is true in edit mode */}
        {shouldShowPublisherInfo && (
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
              {!isEditMode && (
                <div className="text-xs text-white">
                  {currentSlide}/{totalSlides}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex h-full w-full items-center justify-center">
          {isEditMode ? (
            // Editor mode: Render canvas elements
            <>{elements.map(renderElement)}</>
          ) : // Preview mode: Show content or placeholder
          mainContent ? (
            <img
              src={mainContent}
              alt="Story content"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
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

        {/* Bottom CTA - Show in preview mode or when showCTA is true in edit mode */}
        {shouldShowCTA && ctaType && (
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
  )
}

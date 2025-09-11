import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Image, X } from 'lucide-react'
import { toast } from 'sonner'
import { IMAGE_FILTERS } from '@/lib/skins'
import type { StoryFormat, DeviceFrame } from '@snappy/shared-types'
import AdFrame from './AdFrame'

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
  ctaValue?: string
  currentSlide?: number
  totalSlides?: number
  showProgressBar?: boolean

  // Editor mode props
  isEditMode?: boolean
  frameType?: 'story' | 'ad'
  elements?: CanvasElement[]
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
    opacity?: number
    rotation?: number
    zoom?: number
    filter?: string
    offsetX?: number
    offsetY?: number
  }
  adConfig?: {
    adId: string
    adUnitPath?: string
    size?: [number, number]
  }
  selectedElementId?: string
  onElementSelect?: (elementId: string) => void
  onElementUpdate?: (elementId: string, updates: Partial<CanvasElement>) => void
  onElementRemove?: (elementId: string) => void
  onBackgroundSelect?: () => void

  // Edit mode display options
  showPublisherInfo?: boolean
  showCTA?: boolean

  // Format and device frame props
  format?: StoryFormat
  deviceFrame?: DeviceFrame
}

export default function StoryFrame({
  // Preview mode props
  publisherName,
  storyTitle,
  publisherPic,
  ctaType,
  ctaValue,
  currentSlide = 1,
  totalSlides = 4,
  showProgressBar = true,

  // Editor mode props
  isEditMode = false,
  frameType = 'story',
  elements = [],
  background,
  adConfig,
  selectedElementId,
  onElementSelect,
  onElementUpdate,
  onElementRemove,
  onBackgroundSelect,

  // Edit mode display options
  showPublisherInfo = false,
  showCTA = false,

  // Format and device frame props
  format = 'portrait',
  deviceFrame = 'mobile',
}: StoryFrameProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Resize state
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })

  const handleElementClick = (elementId: string, e?: React.MouseEvent) => {
    if (!isEditMode) return
    e?.stopPropagation()
    onElementSelect?.(elementId)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isEditMode) return
    // If clicking on the canvas background, select background
    if (e.target === e.currentTarget) {
      onBackgroundSelect?.()
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
    if (!isEditMode) return

    if (isResizing) {
      handleResizeMove(e)
    } else if (isDragging && selectedElementId && onElementUpdate) {
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
  }

  const handleMouseUp = () => {
    if (!isEditMode) return
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }

  // Resize handlers
  const handleResizeStart = (handle: string, e: React.MouseEvent) => {
    if (!isEditMode || !selectedElementId) return
    e.stopPropagation()
    e.preventDefault()

    const selectedElement = elements.find((el) => el.id === selectedElementId)
    if (!selectedElement) return

    setIsResizing(true)
    setResizeHandle(handle)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: selectedElement.width,
      height: selectedElement.height,
    })
  }

  const handleResizeMove = (e: React.MouseEvent) => {
    if (
      !isEditMode ||
      !isResizing ||
      !selectedElementId ||
      !onElementUpdate ||
      !resizeHandle
    )
      return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    let newWidth = resizeStart.width
    let newHeight = resizeStart.height

    // Calculate new dimensions based on resize handle
    switch (resizeHandle) {
      case 'nw': // Top-left corner
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newHeight = Math.max(50, resizeStart.height - deltaY)
        break
      case 'ne': // Top-right corner
        newWidth = Math.max(50, resizeStart.width + deltaX)
        newHeight = Math.max(50, resizeStart.height - deltaY)
        break
      case 'sw': // Bottom-left corner
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newHeight = Math.max(50, resizeStart.height + deltaY)
        break
      case 'se': // Bottom-right corner
        newWidth = Math.max(50, resizeStart.width + deltaX)
        newHeight = Math.max(50, resizeStart.height + deltaY)
        break
      case 'n': // Top edge
        newHeight = Math.max(50, resizeStart.height - deltaY)
        break
      case 's': // Bottom edge
        newHeight = Math.max(50, resizeStart.height + deltaY)
        break
      case 'w': // Left edge
        newWidth = Math.max(50, resizeStart.width - deltaX)
        break
      case 'e': // Right edge
        newWidth = Math.max(50, resizeStart.width + deltaX)
        break
    }

    onElementUpdate(selectedElementId, {
      width: newWidth,
      height: newHeight,
    })
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
    }

    return (
      <div
        key={element.id}
        style={style}
        onClick={(e) => handleElementClick(element.id, e)}
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

        {/* Resize Handles - Only in edit mode and when selected */}
        {isSelected && isEditMode && (
          <>
            {/* Corner handles */}
            <div
              className="absolute -left-1 -top-1 h-3 w-3 cursor-nw-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('nw', e)}
            />
            <div
              className="absolute -right-1 -top-1 h-3 w-3 cursor-ne-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('ne', e)}
            />
            <div
              className="absolute -bottom-1 -left-1 h-3 w-3 cursor-sw-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('sw', e)}
            />
            <div
              className="absolute -bottom-1 -right-1 h-3 w-3 cursor-se-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('se', e)}
            />

            {/* Edge handles */}
            <div
              className="absolute -top-1 left-1/2 h-3 w-8 -translate-x-1/2 cursor-n-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('n', e)}
            />
            <div
              className="absolute -bottom-1 left-1/2 h-3 w-8 -translate-x-1/2 cursor-s-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('s', e)}
            />
            <div
              className="absolute -left-1 top-1/2 h-8 w-3 -translate-y-1/2 cursor-w-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('w', e)}
            />
            <div
              className="absolute -right-1 top-1/2 h-8 w-3 -translate-y-1/2 cursor-e-resize rounded-full bg-blue-500 opacity-0 transition-opacity group-hover:opacity-100"
              onMouseDown={(e) => handleResizeStart('e', e)}
            />
          </>
        )}

        {element.type === 'text' && (
          <div
            className="flex h-full w-full items-center justify-center text-center"
            style={{
              backgroundColor: element.style.backgroundColor || 'transparent',
              borderRadius: '12px',
              padding: '16px 20px',
              wordWrap: 'break-word',
              overflow: 'hidden',
              fontSize: element.style.fontSize || 16,
              fontFamily: element.style.fontFamily || 'Arial',
              fontWeight: element.style.fontWeight || 'normal',
              color: element.style.color || '#000000',
              lineHeight: '1.2',
              textAlign: 'center',
              boxShadow:
                element.style.backgroundColor &&
                element.style.backgroundColor !== 'transparent'
                  ? '0 4px 12px rgba(0, 0, 0, 0.4)'
                  : 'none',
              border:
                element.style.backgroundColor &&
                element.style.backgroundColor !== 'transparent'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : 'none',
              minHeight: 'fit-content',
              maxHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              hyphens: 'auto',
            }}
          >
            <span
              style={{
                wordBreak: 'break-word',
                hyphens: 'auto',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                display: 'block',
                width: '100%',
              }}
            >
              {element.content}
            </span>
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

  // Scalable background style logic
  const getBackgroundStyle = () => {
    if (background) {
      if (background.type === 'color') {
        return { background: background.value }
      } else if (background.type === 'image') {
        // Don't set background here, handled by <img>
        return {}
      }
    }
    return {
      background: 'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
    }
  }

  // For image backgrounds, render an absolutely positioned <img> with all tweaks
  const getBackgroundImageStyle = () => {
    if (!background || background.type !== 'image' || !background.value)
      return {}
    let style: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      objectFit: 'cover',
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
      minWidth: '100%',
      minHeight: '100%',
    }
    // Opacity
    if (background.opacity !== undefined) {
      style.opacity = background.opacity / 100
    }
    // Transform: center, pan, rotate, zoom
    const x = background.offsetX || 0
    const y = background.offsetY || 0
    const rotation = background.rotation || 0
    const zoom = background.zoom || 1.0 // Default no zoom - fit to frame
    style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${zoom})`
    // Filter/Skins
    if (background.filter) {
      const filterObj = IMAGE_FILTERS.find((f) => f.name === background.filter)
      if (filterObj) {
        style.filter = filterObj.css
      }
    }
    return style
  }

  // Calculate frame dimensions based on format and device frame
  const getFrameDimensions = () => {
    if (format === 'portrait') {
      if (deviceFrame === 'mobile') {
        return {
          width: 'w-72',
          height: 'h-[550px]',
          border: 'rounded-[3rem] border-8 border-gray-400',
        }
      } else {
        // Video player portrait
        return {
          width: 'w-80',
          height: 'h-[600px]',
          border: 'rounded-lg border-4 border-gray-600',
        }
      }
    } else {
      // Landscape format
      if (deviceFrame === 'mobile') {
        return {
          width: 'w-[400px]',
          height: 'h-[225px]',
          border: 'rounded-[2rem] border-6 border-gray-400',
        }
      } else {
        // Video player landscape
        return {
          width: 'w-[480px]',
          height: 'h-[270px]',
          border: 'rounded-lg border-4 border-gray-600',
        }
      }
    }
  }

  const frameDimensions = getFrameDimensions()

  // Determine if we should show publisher info and CTA
  const shouldShowPublisherInfo =
    !isEditMode || (isEditMode && showPublisherInfo)
  const shouldShowCTA =
    (!isEditMode || (isEditMode && showCTA)) && frameType !== 'ad'

  return (
    <div
      className={`relative mx-auto ${frameDimensions.height} ${frameDimensions.width} overflow-hidden ${frameDimensions.border} bg-gray-200 shadow-2xl`}
    >
      {/* Mobile Frame Content */}
      <div
        className="h-full w-full overflow-hidden"
        style={getBackgroundStyle()}
        ref={canvasRef}
        onMouseMove={isEditMode ? handleMouseMove : undefined}
        onMouseUp={isEditMode ? handleMouseUp : undefined}
      >
        {/* Render background image with all tweaks if type is image */}
        {background?.type === 'image' && background.value && (
          <>
            {/* Blurred background image to fill empty areas */}
            <img
              src={background.value}
              alt="Background Blur"
              style={{
                ...getBackgroundImageStyle(),
                filter: 'blur(20px) brightness(0.8)',
                zIndex: -1,
                transform: 'translate(-50%, -50%) scale(1.2)', // Slightly larger to cover edges
              }}
            />
            {/* Main background image */}
            <img
              src={background.value}
              alt="Background"
              style={getBackgroundImageStyle()}
            />
          </>
        )}
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
        <div
          className="flex h-full w-full items-center justify-center"
          onClick={isEditMode ? handleCanvasClick : undefined}
        >
          {frameType === 'ad' && adConfig ? (
            <>
              {console.log('Rendering AdFrame:', {
                frameType,
                adConfig,
                isEditMode,
              })}
              <AdFrame
                adId={adConfig.adId}
                adUnitPath={adConfig.adUnitPath}
                size={adConfig.size}
                isEditMode={isEditMode}
                className="h-full w-full"
              />
            </>
          ) : (elements && elements.length > 0) || background ? (
            <>{elements.map(renderElement)}</>
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
            {ctaType === 'redirect' && ctaValue ? (
              <a
                href={ctaValue}
                target="_blank"
                rel="noopener noreferrer"
                className="block cursor-pointer rounded-full bg-white/90 px-6 py-3 text-center backdrop-blur-sm transition-colors hover:bg-white"
              >
                <div className="text-sm font-semibold text-black">
                  Visit Link
                </div>
              </a>
            ) : (
              <div className="rounded-full bg-white/90 px-6 py-3 text-center backdrop-blur-sm">
                <div className="text-sm font-semibold text-black">
                  {ctaType === 'form' && 'Fill Form'}
                  {ctaType === 'promo' && 'Get Promo'}
                  {ctaType === 'sell' && 'Buy Now'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

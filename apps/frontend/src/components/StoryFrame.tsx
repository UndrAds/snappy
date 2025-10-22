import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Image, X, Link } from 'lucide-react'
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
    opacity?: number // Overall element opacity (for backward compatibility)
    textOpacity?: number // Text color opacity
    backgroundOpacity?: number // Background color opacity
    rotation?: number
    zoom?: number
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
  ctaText?: string
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
  link?: string // Optional link URL for the frame
  linkText?: string // Optional link label for the frame link indicator
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
  ctaText,
  currentSlide = 1,
  totalSlides = 4,
  showProgressBar = true,

  // Editor mode props
  isEditMode = false,
  frameType = 'story',
  elements = [],
  background,
  adConfig,
  link,
  linkText,
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
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [hoveredElementId, setHoveredElementId] = useState<string | null>(null)
  const lastUpdateTime = useRef(0)

  // Resize state
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    bottomEdge: 0,
    rightEdge: 0,
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
    e.preventDefault()
    setIsDragging(true)

    // Calculate initial offset from element position
    const selectedElement = elements.find((el) => el.id === selectedElementId)
    if (selectedElement) {
      setDragOffset({
        x: e.clientX - selectedElement.x,
        y: e.clientY - selectedElement.y,
      })
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditMode) return

      if (isResizing) {
        handleResizeMove(e)
      } else if (isDragging && selectedElementId && onElementUpdate) {
        // Throttle updates to improve performance
        const now = Date.now()
        if (now - lastUpdateTime.current < 16) return // ~60fps
        lastUpdateTime.current = now

        // Calculate new position using the offset to prevent jittery movement
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y

        onElementUpdate(selectedElementId, {
          x: newX,
          y: newY,
        })
      }
    },
    [
      isEditMode,
      isResizing,
      isDragging,
      selectedElementId,
      onElementUpdate,
      dragOffset,
    ]
  )

  const handleMouseUp = () => {
    if (!isEditMode) return
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setDragOffset({ x: 0, y: 0 })
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
      // Store the bottom and right edges for reference
      bottomEdge: selectedElement.y + selectedElement.height,
      rightEdge: selectedElement.x + selectedElement.width,
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

    const selectedElement = elements.find((el) => el.id === selectedElementId)
    if (!selectedElement) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y

    // Get frame dimensions
    const getFramePixelDimensions = () => {
      if (format === 'portrait') {
        if (deviceFrame === 'mobile') {
          return { width: 288, height: 550 }
        } else {
          return { width: 320, height: 568 }
        }
      } else {
        if (deviceFrame === 'mobile') {
          return { width: 550, height: 288 }
        } else {
          return { width: 568, height: 320 }
        }
      }
    }

    const { width: frameWidth, height: frameHeight } = getFramePixelDimensions()

    let newWidth = resizeStart.width
    let newHeight = resizeStart.height
    let newX = selectedElement.x
    let newY = selectedElement.y

    // Calculate new dimensions based on resize handle
    // Use fixed edge approach - keep one edge fixed and move the other
    switch (resizeHandle) {
      case 'nw': // Top-left corner - keep bottom-right fixed
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newHeight = Math.max(50, resizeStart.height - deltaY)
        newX = resizeStart.rightEdge - newWidth
        newY = resizeStart.bottomEdge - newHeight
        break
      case 'ne': // Top-right corner - keep bottom-left fixed
        newWidth = Math.max(50, resizeStart.width + deltaX)
        newHeight = Math.max(50, resizeStart.height - deltaY)
        newY = resizeStart.bottomEdge - newHeight
        break
      case 'sw': // Bottom-left corner - keep top-right fixed
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newHeight = Math.max(50, resizeStart.height + deltaY)
        newX = resizeStart.rightEdge - newWidth
        break
      case 'se': // Bottom-right corner - keep top-left fixed
        newWidth = Math.max(50, resizeStart.width + deltaX)
        newHeight = Math.max(50, resizeStart.height + deltaY)
        break
      case 'n': // Top edge - keep bottom edge fixed
        newHeight = Math.max(50, resizeStart.height - deltaY)
        newY = resizeStart.bottomEdge - newHeight
        break
      case 's': // Bottom edge - keep top edge fixed
        newHeight = Math.max(50, resizeStart.height + deltaY)
        break
      case 'w': // Left edge - keep right edge fixed
        newWidth = Math.max(50, resizeStart.width - deltaX)
        newX = resizeStart.rightEdge - newWidth
        break
      case 'e': // Right edge - keep left edge fixed
        newWidth = Math.max(50, resizeStart.width + deltaX)
        break
    }

    // Final boundary constraints
    newX = Math.max(0, Math.min(newX, frameWidth - newWidth))
    newY = Math.max(0, Math.min(newY, frameHeight - newHeight))
    newWidth = Math.min(newWidth, frameWidth - newX)
    newHeight = Math.min(newHeight, frameHeight - newY)

    onElementUpdate(selectedElementId, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
    })
  }

  const handleDeleteElement = (elementId: string, e: React.MouseEvent) => {
    if (!isEditMode) return
    e.stopPropagation()
    e.preventDefault()
    onElementRemove?.(elementId)
    toast.success('Element deleted!')
  }

  // Helper function to apply opacity to a color
  const applyOpacityToColor = (
    color: string,
    opacity: number = 100
  ): string => {
    if (!color) return 'transparent'

    // If opacity is 0, return transparent regardless of color
    if (opacity === 0) return 'transparent'

    // If color is transparent, return transparent (no opacity to apply)
    if (color === 'transparent') return color

    // If color is already rgba, extract the RGB values and apply new opacity
    if (color.startsWith('rgba(')) {
      const rgbaMatch = color.match(
        /rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/
      )
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
      }
    }

    // If color is hex, convert to rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
    }

    // If color is rgb, convert to rgba
    if (color.startsWith('rgb(')) {
      const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (rgbMatch) {
        const [, r, g, b] = rgbMatch
        return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
      }
    }

    // Fallback: return original color
    return color
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
      overflow: 'visible' as const,
      zIndex: isSelected ? 10 : 1,
    }

    return (
      <div
        key={element.id}
        style={style}
        onClick={(e) => handleElementClick(element.id, e)}
        onDoubleClick={() => handleElementDoubleClick(element)}
        onMouseDown={isEditMode ? (e) => handleMouseDown(e) : undefined}
        className={`${isSelected && isEditMode ? 'ring-2 ring-blue-500' : ''} group relative transition-all ${isDragging && selectedElementId === element.id ? 'transition-none' : ''}`}
        onMouseEnter={() => setHoveredElementId(element.id)}
        onMouseLeave={() => setHoveredElementId(null)}
      >
        {/* Delete Button - Only in edit mode */}
        {isSelected && isEditMode && (
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => handleDeleteElement(element.id, e)}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            className={`pointer-events-auto absolute right-0 top-0 z-30 h-6 w-6 cursor-pointer p-0 transition-opacity ${
              hoveredElementId === element.id ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Resize Handles - Only in edit mode and when selected */}
        {isSelected && isEditMode && (
          <>
            {/* Corner handles - more subtle and modern */}
            <div
              className={`absolute -left-1 -top-1 h-4 w-4 cursor-nw-resize rounded-sm border-2 border-white bg-primary shadow-lg transition-all duration-200 ${
                hoveredElementId === element.id
                  ? 'scale-110 opacity-100'
                  : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('nw', e)}
            />
            <div
              className={`absolute -right-1 -top-1 h-4 w-4 cursor-ne-resize rounded-sm border-2 border-white bg-primary shadow-lg transition-all duration-200 ${
                hoveredElementId === element.id
                  ? 'scale-110 opacity-100'
                  : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('ne', e)}
            />
            <div
              className={`absolute -bottom-1 -left-1 h-4 w-4 cursor-sw-resize rounded-sm border-2 border-white bg-primary shadow-lg transition-all duration-200 ${
                hoveredElementId === element.id
                  ? 'scale-110 opacity-100'
                  : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('sw', e)}
            />
            <div
              className={`absolute -bottom-1 -right-1 h-4 w-4 cursor-se-resize rounded-sm border-2 border-white bg-primary shadow-lg transition-all duration-200 ${
                hoveredElementId === element.id
                  ? 'scale-110 opacity-100'
                  : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('se', e)}
            />

            {/* Edge handles - more subtle */}
            <div
              className={`absolute -top-1 left-1/2 h-2 w-12 -translate-x-1/2 cursor-n-resize rounded-full bg-white shadow-md transition-all duration-200 ${
                hoveredElementId === element.id ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('n', e)}
            />
            <div
              className={`absolute -bottom-1 left-1/2 h-2 w-12 -translate-x-1/2 cursor-s-resize rounded-full bg-white shadow-md transition-all duration-200 ${
                hoveredElementId === element.id ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('s', e)}
            />
            <div
              className={`absolute -left-1 top-1/2 h-12 w-2 -translate-y-1/2 cursor-w-resize rounded-full bg-white shadow-md transition-all duration-200 ${
                hoveredElementId === element.id ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('w', e)}
            />
            <div
              className={`absolute -right-1 top-1/2 h-12 w-2 -translate-y-1/2 cursor-e-resize rounded-full bg-white shadow-md transition-all duration-200 ${
                hoveredElementId === element.id ? 'opacity-100' : 'opacity-0'
              }`}
              onMouseDown={(e) => handleResizeStart('e', e)}
            />
          </>
        )}

        {element.type === 'text' && (
          <div
            className="flex h-full w-full items-center justify-center text-center"
            style={{
              backgroundColor: applyOpacityToColor(
                element.style.backgroundColor || 'transparent',
                element.style.backgroundOpacity || 100
              ),
              borderRadius: '12px',
              padding: '16px 20px',
              wordWrap: 'break-word',
              overflow: 'hidden',
              fontSize: element.style.fontSize || 16,
              fontFamily: element.style.fontFamily || 'Arial',
              fontWeight: element.style.fontWeight || 'normal',
              color: applyOpacityToColor(
                element.style.color || '#000000',
                element.style.textOpacity || element.style.opacity || 100
              ),
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
          <div className="h-full w-full overflow-hidden">
            <img
              src={element.mediaUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${(element.style?.zoom || 100) / 100})`,
                transformOrigin: 'center center',
              }}
            />
          </div>
        )}

        {element.type === 'image' && !element.mediaUrl && (
          <div className="flex h-full w-full items-center justify-center border-2 border-dashed border-border bg-muted">
            <Image className="h-8 w-8 text-muted-foreground" />
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

    // Get frame dimensions for proper scaling
    const getFramePixelDimensions = () => {
      if (format === 'portrait') {
        if (deviceFrame === 'mobile') {
          return { width: 288, height: 550 }
        } else {
          return { width: 320, height: 568 }
        }
      } else {
        if (deviceFrame === 'mobile') {
          return { width: 550, height: 288 }
        } else {
          return { width: 568, height: 320 }
        }
      }
    }

    const { width: frameWidth, height: frameHeight } = getFramePixelDimensions()

    let style: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      top: '50%',
      objectFit: 'none', // Changed from 'cover' to 'none' to allow panning
      zIndex: 0,
      pointerEvents: 'none',
    }

    // Opacity
    if (background.opacity !== undefined) {
      style.opacity = background.opacity / 100
    }

    // Calculate zoom and sizing
    const userZoom = background.zoom !== undefined ? background.zoom / 100 : 1.0
    const rotation = background.rotation || 0
    const x = background.offsetX || 0
    const y = background.offsetY || 0

    // Calculate the minimum scale needed to cover the frame
    // This ensures the image always covers the frame like object-fit: cover
    const minScaleToCover =
      Math.max(frameWidth, frameHeight) / Math.min(frameWidth, frameHeight)

    // Add a safety buffer (20% extra) to ensure complete coverage with no gaps
    const safetyBuffer = 1.2
    const safeCoverScale = minScaleToCover * safetyBuffer

    // Use a base size that ensures coverage
    const baseSize = Math.max(frameWidth, frameHeight) * 2
    style.width = `${baseSize}px`
    style.height = `${baseSize}px`

    // Apply the safe cover scale as the base, then apply user zoom on top
    // This ensures the image always covers the frame with a safety margin
    const finalZoom = safeCoverScale * userZoom

    // Apply transforms: center, pan, rotate, zoom
    style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${finalZoom})`

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
          border: 'rounded-[3rem] border-8 border-border',
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
          border: 'rounded-[2rem] border-6 border-border',
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

  // Handle frame click for links
  const handleFrameClick = (e: React.MouseEvent) => {
    // Only handle clicks when not in edit mode and link exists
    if (!isEditMode && link) {
      e.preventDefault()
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div
      className={`relative mx-auto ${frameDimensions.height} ${frameDimensions.width} overflow-hidden ${frameDimensions.border} bg-muted shadow-2xl transition-all duration-200 ${
        !isEditMode && link
          ? 'hover:shadow-3xl cursor-pointer hover:shadow-blue-500/20'
          : ''
      } ${
        link && !isEditMode
          ? 'ring-2 ring-blue-400/30 ring-offset-2 ring-offset-transparent'
          : ''
      }`}
      onClick={handleFrameClick}
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
                  {ctaText && ctaText.trim() ? ctaText : 'Visit Link'}
                </div>
              </a>
            ) : (
              <div className="rounded-full bg-white/90 px-6 py-3 text-center backdrop-blur-sm">
                <div className="text-sm font-semibold text-black">
                  {ctaText && ctaText.trim()
                    ? ctaText
                    : ctaType === 'form'
                      ? 'Fill Form'
                      : ctaType === 'promo'
                        ? 'Get Promo'
                        : 'Buy Now'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Link Indicator Overlay - Show when frame has a link */}
      {link && (
        <div className="absolute right-3 top-16 z-50">
          <div className="flex items-center space-x-1 rounded-full bg-primary/90 px-2 py-1 text-primary-foreground shadow-lg backdrop-blur-sm">
            <Link className="h-3 w-3" />
            <span className="text-xs font-medium">
              {linkText && linkText.trim() ? linkText : 'Link'}
            </span>
          </div>
        </div>
      )}

      {/* Clickable Frame Indicator - Show when in edit mode and frame has link */}
      {isEditMode && link && (
        <div className="absolute bottom-16 left-3 z-50">
          <div className="rounded-full bg-green-600 px-2 py-1 text-white shadow-lg backdrop-blur-sm dark:bg-green-500">
            <span className="text-xs font-medium">Clickable</span>
          </div>
        </div>
      )}

      {/* Preview Mode Link Hint - Show subtle hint in preview mode */}
      {!isEditMode && link && (
        <div className="absolute bottom-3 right-3 z-50">
          <div className="rounded-full bg-white/20 px-2 py-1 text-white shadow-lg backdrop-blur-sm">
            <span className="text-xs font-medium">Click to open</span>
          </div>
        </div>
      )}
    </div>
  )
}

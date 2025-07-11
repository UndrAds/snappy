import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Type, Image, Shapes, X } from 'lucide-react'
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
}

export default function EditorCanvas({
  elements,
  background,
  onElementSelect,
  onElementUpdate,
  onElementAdd,
  onElementRemove,
  selectedElementId,
}: EditorCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

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

  const handleElementClick = (elementId: string) => {
    onElementSelect(elementId)
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    // If clicking on the canvas background, deselect
    if (e.target === e.currentTarget) {
      onElementSelect('')
    }
  }

  const handleElementDoubleClick = (element: CanvasElement) => {
    if (element.type === 'text') {
      const newContent = prompt('Enter text:', element.content)
      if (newContent !== null) {
        onElementUpdate(element.id, { content: newContent })
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElementId) return

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
    setIsDragging(false)
  }

  const handleDeleteElement = (elementId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onElementRemove(elementId)
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
      cursor: 'pointer',
      border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
      filter: `brightness(${element.style.brightness}%) contrast(${element.style.contrast}%) saturate(${element.style.saturation}%)`,
    }

    return (
      <div
        key={element.id}
        style={style}
        onClick={() => handleElementClick(element.id)}
        onDoubleClick={() => handleElementDoubleClick(element)}
        onMouseDown={(e) => handleMouseDown(e)}
        className={`${isSelected ? 'ring-2 ring-blue-500' : ''} group relative transition-all`}
      >
        {/* Delete Button */}
        {isSelected && (
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
          <div className="h-full w-full rounded-lg bg-gradient-to-br from-blue-500 to-purple-500"></div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gray-100 p-8">
      <div className="relative">
        {/* Mobile Frame */}
        <div className="relative h-[600px] w-[320px] overflow-hidden rounded-[2rem] border-8 border-gray-400 bg-gray-200 shadow-2xl">
          {/* Canvas Area */}
          <div
            ref={canvasRef}
            className="relative h-full w-full overflow-hidden bg-black"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={handleCanvasClick}
          >
            {/* Background */}
            {background?.type === 'color' && (
              <div
                className="absolute inset-0"
                style={{ background: background.value }}
              ></div>
            )}
            {background?.type === 'image' && (
              <img
                src={background.value}
                alt="Background"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {background?.type === 'video' && (
              <video
                src={background.value}
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                muted
                loop
              />
            )}
            {!background && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500"></div>
            )}

            {/* Elements */}
            {elements.map(renderElement)}

            {/* Add Element Buttons */}
            <div className="absolute bottom-4 right-4 flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleAddElement('text')}
                className="h-8 w-8 p-0"
                title="Add Text"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddElement('image')}
                className="h-8 w-8 p-0"
                title="Add Image"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => handleAddElement('shape')}
                className="h-8 w-8 p-0"
                title="Add Shape"
              >
                <Shapes className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Info */}
        <div className="absolute -bottom-8 left-0 right-0 text-center text-sm text-muted-foreground">
          {elements.length} element{elements.length !== 1 ? 's' : ''} •
          {selectedElementId ? ' Element selected' : ' No element selected'}
        </div>
      </div>
    </div>
  )
}

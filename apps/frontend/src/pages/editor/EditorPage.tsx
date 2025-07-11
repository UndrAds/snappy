import { useState } from 'react'
import { toast } from 'sonner'
import EditorLayout from './EditorLayout'
import EditorSidebar from './components/EditorSidebar'
import EditorCanvas from './components/EditorCanvas'
import PropertyPanel from './components/PropertyPanel'

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

interface StoryFrame {
  id: string
  order: number
  elements: CanvasElement[]
  hasContent: boolean
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
  }
}

export default function EditorPage() {
  const [frames, setFrames] = useState<StoryFrame[]>([
    {
      id: '1',
      order: 1,
      elements: [],
      hasContent: false,
      background: {
        type: 'color',
        value: 'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
      },
    },
  ])
  const [selectedFrameId, setSelectedFrameId] = useState<string>('1')
  const [selectedElementId, setSelectedElementId] = useState<string>('')

  const addNewFrame = () => {
    const newFrame: StoryFrame = {
      id: Date.now().toString(),
      order: frames.length + 1,
      elements: [],
      hasContent: false,
    }
    setFrames((prev) => [...prev, newFrame])
    setSelectedFrameId(newFrame.id)
    setSelectedElementId('')
    toast.success('New frame added!')
  }

  const removeFrame = (frameId: string) => {
    if (frames.length <= 1) {
      toast.error('Cannot remove the last frame')
      return
    }

    setFrames((prev) => prev.filter((frame) => frame.id !== frameId))

    if (selectedFrameId === frameId) {
      const remainingFrames = frames.filter((frame) => frame.id !== frameId)
      setSelectedFrameId(remainingFrames[0]?.id || '')
      setSelectedElementId('')
    }

    toast.success('Frame removed')
  }

  const duplicateFrame = (frameId: string) => {
    const frameToDuplicate = frames.find((f) => f.id === frameId)
    if (!frameToDuplicate) return

    const newFrame: StoryFrame = {
      id: Date.now().toString(),
      order: frames.length + 1,
      elements: [...frameToDuplicate.elements],
      hasContent: frameToDuplicate.hasContent,
    }

    setFrames((prev) => [...prev, newFrame])
    setSelectedFrameId(newFrame.id)
    setSelectedElementId('')
    toast.success('Frame duplicated!')
  }

  const addElement = (element: CanvasElement) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === selectedFrameId
          ? {
              ...frame,
              elements: [...frame.elements, element],
              hasContent: true,
            }
          : frame
      )
    )
  }

  const updateElement = (
    elementId: string,
    updates: Partial<CanvasElement>
  ) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === selectedFrameId
          ? {
              ...frame,
              elements: frame.elements.map((el) =>
                el.id === elementId
                  ? {
                      ...el,
                      ...updates,
                      style: {
                        ...el.style,
                        ...(updates.style || {}),
                      },
                    }
                  : el
              ),
            }
          : frame
      )
    )
  }

  const removeElement = (elementId: string) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === selectedFrameId
          ? {
              ...frame,
              elements: frame.elements.filter((el) => el.id !== elementId),
              hasContent: frame.elements.length > 1,
            }
          : frame
      )
    )
    setSelectedElementId('')
  }

  const updateBackground = (background: {
    type: 'color' | 'image' | 'video'
    value: string
  }) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === selectedFrameId
          ? {
              ...frame,
              background,
            }
          : frame
      )
    )
  }

  const handleSave = () => {
    toast.success('Story saved successfully!')
  }

  const handleUndo = () => {
    toast.info('Undo functionality coming soon!')
  }

  const handleRedo = () => {
    toast.info('Redo functionality coming soon!')
  }

  const handlePreview = () => {
    toast.info('Preview functionality coming soon!')
  }

  const handleExport = () => {
    toast.info('Export functionality coming soon!')
  }

  const selectedFrame = frames.find((frame) => frame.id === selectedFrameId)
  const selectedElement = selectedFrame?.elements.find(
    (el) => el.id === selectedElementId
  )

  return (
    <EditorLayout
      onSave={handleSave}
      onUndo={handleUndo}
      onRedo={handleRedo}
      onPreview={handlePreview}
      onExport={handleExport}
    >
      <EditorSidebar
        frames={frames}
        selectedFrameId={selectedFrameId}
        onAddFrame={addNewFrame}
        onRemoveFrame={removeFrame}
        onDuplicateFrame={duplicateFrame}
        onSelectFrame={(frameId) => {
          setSelectedFrameId(frameId)
          setSelectedElementId('')
        }}
        onAddElement={addElement}
      />

      <EditorCanvas
        elements={selectedFrame?.elements || []}
        background={selectedFrame?.background}
        selectedElementId={selectedElementId}
        onElementSelect={setSelectedElementId}
        onElementUpdate={updateElement}
        onElementAdd={addElement}
        onElementRemove={removeElement}
      />

      <PropertyPanel
        selectedElement={
          selectedElement
            ? {
                type: selectedElement.type,
                id: selectedElement.id,
                style: selectedElement.style,
              }
            : undefined
        }
        background={selectedFrame?.background}
        onElementUpdate={updateElement}
        onBackgroundUpdate={updateBackground}
      />
    </EditorLayout>
  )
}

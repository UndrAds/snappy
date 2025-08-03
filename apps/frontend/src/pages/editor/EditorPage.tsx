import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useLocation } from 'react-router-dom'
import EditorLayout from './EditorLayout'
import EditorSidebar from './components/EditorSidebar'
import EditorCanvas from './components/EditorCanvas'
import PropertyPanel from './components/propertyPanel'
import EmbedModal from './components/EmbedModal'

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
    opacity?: number
    rotation?: number
    zoom?: number
    filter?: string
    offsetX?: number
    offsetY?: number
    // Add more as needed
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
}

declare global {
  interface Window {
    previewData?: any
  }
}

export default function EditorPage() {
  const location = useLocation()
  // Change storyData to be stateful so it can be updated if needed
  const [storyDataState, _setStoryDataState] = useState<StoryData>(
    location.state?.storyData || {
      storyTitle: '',
      publisherName: '',
      publisherPic: '',
      thumbnail: '',
      background: '',
      ctaType: null,
      ctaValue: '',
    }
  )
  const fromCreate = location.state?.fromCreate || false

  const [frames, setFrames] = useState<StoryFrame[]>([
    {
      id: '1',
      order: 1,
      elements: [],
      hasContent: false,
      background: storyDataState?.background
        ? {
            type: 'image' as const,
            value: storyDataState.background,
          }
        : {
            type: 'color' as const,
            value:
              'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
          },
    },
  ])
  const [selectedFrameId, setSelectedFrameId] = useState<string>('1')
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  const [embedOpen, setEmbedOpen] = useState(false)

  // Show welcome message if coming from create page
  useEffect(() => {
    if (fromCreate && storyDataState) {
      toast.success(
        `Welcome to the editor! You can now customize your story "${storyDataState.storyTitle}"`
      )
    }
  }, [fromCreate, storyDataState])

  const addNewFrame = () => {
    const newFrame: StoryFrame = {
      id: Date.now().toString(),
      order: frames.length + 1,
      elements: [],
      hasContent: false,
      background: {
        type: 'color',
        value: 'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
        opacity: 100,
        rotation: 0,
        zoom: 100,
        filter: 'None',
        offsetX: 0,
        offsetY: 0,
      },
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
    opacity?: number
    rotation?: number
    zoom?: number
    filter?: string
    offsetX?: number
    offsetY?: number
    // Add more as needed
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
    const previewWindow = window.open('/editor/preview', '_blank')
    if (previewWindow) {
      previewWindow.previewData = {
        storyData: storyDataState,
        frames,
      }
    }
  }

  const handleEmbed = () => {
    setEmbedOpen(true)
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
      onEmbed={handleEmbed}
      storyTitle={storyDataState?.storyTitle}
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
        onBackgroundSelect={() => setSelectedElementId('background')}
        onElementUpdate={updateElement}
        onElementAdd={addElement}
        onElementRemove={removeElement}
        storyData={storyDataState}
        currentSlide={
          frames.findIndex((frame) => frame.id === selectedFrameId) + 1
        }
        totalSlides={frames.length}
      />

      <PropertyPanel
        selectedElement={
          selectedElementId === 'background'
            ? undefined
            : selectedElement
              ? { ...selectedElement }
              : undefined
        }
        background={selectedFrame?.background}
        onElementUpdate={updateElement}
        onBackgroundUpdate={updateBackground}
        onElementRemove={removeElement}
      />
      <EmbedModal
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        storyId={storyDataState?.storyTitle || 'demo'}
        storyData={{ story: storyDataState, frames }}
      />
    </EditorLayout>
  )
}

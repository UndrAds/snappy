import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useLocation, useParams } from 'react-router-dom'
import EditorLayout from './EditorLayout'
import EditorSidebar from './components/EditorSidebar'
import EditorCanvas from './components/EditorCanvas'
import PropertyPanel from './components/propertyPanel'
import EmbedModal from './components/EmbedModal'
import { storyAPI } from '@/lib/api'

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
  type: 'story' | 'ad'
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
  adConfig?: {
    adId: string
    adUnitPath?: string
    size?: [number, number]
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
  format?: 'portrait' | 'landscape'
  deviceFrame?: 'mobile' | 'video-player'
}

declare global {
  interface Window {
    previewData?: any
  }
}

export default function EditorPage() {
  const location = useLocation()
  const params = useParams()

  // Get uniqueId from URL params or location state
  const uniqueId = params.uniqueId || location.state?.uniqueId

  const [storyDataState, setStoryDataState] = useState<StoryData>(
    location.state?.storyData || {
      storyTitle: '',
      publisherName: '',
      publisherPic: '',
      thumbnail: '',
      background: '',
      ctaType: null,
      ctaValue: '',
      format: 'portrait',
      deviceFrame: 'mobile',
    }
  )
  const fromCreate = location.state?.fromCreate || false
  const storyId = location.state?.storyId

  const [frames, setFrames] = useState<StoryFrame[]>([
    {
      id: '1',
      order: 1,
      type: 'story',
      elements: [],
      hasContent: false,
      background: location.state?.storyData?.thumbnail
        ? {
            type: 'image' as const,
            value: location.state.storyData.thumbnail,
            opacity: 100, // Set default opacity to 100
          }
        : {
            type: 'color' as const,
            value:
              'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
            opacity: 100, // Set default opacity to 100
          },
    },
  ])

  const [selectedFrameId, setSelectedFrameId] = useState<string>('1')
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  const [embedOpen, setEmbedOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [_isLoading, setIsLoading] = useState(false)
  const [currentStoryId, setCurrentStoryId] = useState<string | undefined>(
    storyId
  )

  // Update initial frame when coming from create page
  useEffect(() => {
    if (
      fromCreate &&
      location.state?.storyData?.thumbnail &&
      frames.length > 0
    ) {
      setFrames((prev) =>
        prev.map((frame) =>
          frame.id === '1'
            ? {
                ...frame,
                background: {
                  type: 'image' as const,
                  value: location.state.storyData.thumbnail,
                  opacity: 100, // Set default opacity to 100
                },
              }
            : frame
        )
      )
    }
  }, [fromCreate, location.state?.storyData?.thumbnail])

  // Load story data if uniqueId is provided in URL
  useEffect(() => {
    const loadStory = async () => {
      if (uniqueId && !fromCreate) {
        try {
          setIsLoading(true)
          const response = await storyAPI.getStoryByUniqueId(uniqueId)

          if (response.success && response.data) {
            const story = response.data

            // Set the story ID for saving
            setCurrentStoryId(story.id)

            // Update story data
            setStoryDataState({
              storyTitle: story.title,
              publisherName: story.publisherName,
              publisherPic: story.publisherPic || '',
              thumbnail: story.largeThumbnail || '',
              background: story.largeThumbnail || '',
              ctaType: story.ctaType as any,
              ctaValue: story.ctaValue || '',
              format: (story.format as 'portrait' | 'landscape') || 'portrait',
              deviceFrame:
                (story.deviceFrame as 'mobile' | 'video-player') || 'mobile',
            })

            // Convert database frames to editor frames
            if (story.frames && story.frames.length > 0) {
              const editorFrames = story.frames.map((frame: any) => ({
                id: frame.id,
                order: frame.order,
                type: frame.type || 'story',
                elements: frame.elements || [],
                hasContent: frame.hasContent,
                adConfig: frame.adConfig,
                background: frame.background
                  ? {
                      type: frame.background.type as
                        | 'color'
                        | 'image'
                        | 'video',
                      value: frame.background.value,
                      opacity: frame.background.opacity ?? 100, // Use 100 as default if not set
                      rotation: frame.background.rotation,
                      zoom: frame.background.zoom,
                      filter: frame.background.filter,
                      offsetX: frame.background.offsetX,
                      offsetY: frame.background.offsetY,
                    }
                  : {
                      type: 'color' as const,
                      value:
                        'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
                      opacity: 100, // Set default opacity to 100
                    },
              }))

              setFrames(editorFrames)
              setSelectedFrameId(editorFrames[0]?.id || '1')
            } else {
              // If no frames exist, create a default frame with the story's background
              const defaultFrame: StoryFrame = {
                id: '1',
                order: 1,
                type: 'story',
                elements: [],
                hasContent: false,
                background: story.largeThumbnail
                  ? {
                      type: 'image' as const,
                      value: story.largeThumbnail,
                      opacity: 100, // Set default opacity to 100
                    }
                  : {
                      type: 'color' as const,
                      value:
                        'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
                      opacity: 100, // Set default opacity to 100
                    },
              }
              setFrames([defaultFrame])
              setSelectedFrameId('1')
            }

            toast.success(`Loaded story: ${story.title}`)
          } else {
            toast.error('Story not found')
          }
        } catch (error) {
          console.error('Load story error:', error)
          toast.error('Failed to load story')
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadStory()
  }, [uniqueId, fromCreate])

  // Show welcome message if coming from create page
  useEffect(() => {
    if (fromCreate && storyDataState) {
      toast.success(
        `Welcome to the editor! You can now customize your story "${storyDataState.storyTitle}"`
      )
    }
  }, [fromCreate, storyDataState])

  const addNewFrame = (frameType: 'story' | 'ad' = 'story') => {
    const newFrame: StoryFrame = {
      id: Date.now().toString(),
      order: frames.length + 1,
      type: frameType,
      elements: [],
      hasContent: false,
      background:
        frameType === 'story'
          ? {
              type: 'color',
              value:
                'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
              opacity: 100, // Set default opacity to 100
            }
          : undefined,
      adConfig:
        frameType === 'ad'
          ? {
              adId: 'UNDR/1234/mobile/300X250/mobile-ad-1',
              adUnitPath: 'UNDR/1234/mobile/300X250/mobile-ad-1',
              size: [300, 250],
            }
          : undefined,
    }
    setFrames((prev) => [...prev, newFrame])
    setSelectedFrameId(newFrame.id)
    setSelectedElementId('')
    toast.success(`New ${frameType} frame added!`)
  }

  const removeFrame = (frameId: string) => {
    if (frames.length > 1) {
      setFrames((prev) => prev.filter((frame) => frame.id !== frameId))
      if (selectedFrameId === frameId) {
        setSelectedFrameId(frames[0].id)
      }
    }
    toast.success('Frame removed')
  }

  const duplicateFrame = (frameId: string) => {
    const frameToDuplicate = frames.find((frame) => frame.id === frameId)
    if (frameToDuplicate) {
      const newFrame: StoryFrame = {
        ...frameToDuplicate,
        id: Date.now().toString(),
        order: frames.length + 1,
        adConfig:
          frameToDuplicate.type === 'ad'
            ? {
                ...frameToDuplicate.adConfig,
                adId: `ad-${Date.now()}`,
              }
            : frameToDuplicate.adConfig,
      }
      setFrames((prev) => [...prev, newFrame])
      setSelectedFrameId(newFrame.id)
      setSelectedElementId('')
      toast.success(`${frameToDuplicate.type} frame duplicated!`)
    }
  }

  const createAutomatedStory = (content: {
    headlines: string[]
    images: Array<{
      url: string
      alt: string
    }>
  }) => {
    // Get the current maximum order to append new frames
    const maxOrder =
      frames.length > 0 ? Math.max(...frames.map((f) => f.order)) : 0

    // Create frames by matching headlines with images
    const newFrames: StoryFrame[] = []
    const maxItems = Math.max(content.headlines.length, content.images.length)

    for (let i = 0; i < maxItems; i++) {
      const headline =
        content.headlines[i] ||
        content.headlines[content.headlines.length - 1] ||
        'Untitled'
      const image =
        content.images[i] || content.images[content.images.length - 1]

      if (!image) continue // Skip if no image available

      const frameId = `auto-${Date.now()}-${i}`
      const frameOrder = maxOrder + i + 1

      newFrames.push({
        id: frameId,
        order: frameOrder,
        type: 'story' as const,
        elements: [
          {
            id: `text-${frameId}`,
            type: 'text' as const,
            x: 150, // Position from left edge
            y: 150, // Position from top edge
            width: 400, // Smaller width to not cover entire frame
            height: 80, // Compact height
            content: headline,
            style: {
              fontSize: 28,
              fontFamily: 'Arial',
              fontWeight: 'bold',
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              opacity: 100,
              rotation: 0,
              brightness: 50,
              contrast: 50,
              saturation: 50,
              sharpness: 50,
              highlights: 50,
              filter: 'none',
            },
          },
          {
            id: `frame-number-${frameId}`,
            type: 'text' as const,
            x: 50, // Bottom left corner
            y: 350, // Near bottom of frame
            width: 100,
            height: 40,
            content: `Frame ${frameOrder}`,
            style: {
              fontSize: 16,
              fontFamily: 'Arial',
              fontWeight: 'normal',
              color: '#ffffff',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              opacity: 100,
              rotation: 0,
              brightness: 50,
              contrast: 50,
              saturation: 50,
              sharpness: 50,
              highlights: 50,
              filter: 'none',
            },
          },
        ],
        hasContent: true,
        background: {
          type: 'image' as const,
          value: image.url,
          opacity: 100,
          zoom: 1.0, // No zoom - fit to frame
          filter: 'none', // No filter for now
          offsetX: 0,
          offsetY: 0,
        },
      })
    }

    // Append new frames to existing frames instead of replacing them
    setFrames((prevFrames) => [...prevFrames, ...newFrames])

    // Select the first new frame
    if (newFrames.length > 0) {
      setSelectedFrameId(newFrames[0].id)
    }
    setSelectedElementId('')

    toast.success(
      `Added ${newFrames.length} new story frames with automated content!`
    )
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
              elements: frame.elements.map((element) =>
                element.id === elementId ? { ...element, ...updates } : element
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
              elements: frame.elements.filter(
                (element) => element.id !== elementId
              ),
              hasContent:
                frame.elements.filter((element) => element.id !== elementId)
                  .length > 0,
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

  const handleSave = async () => {
    try {
      setIsSaving(true)

      // Prepare story data for backend
      const storyData = {
        story: {
          id: currentStoryId, // Use currentStoryId instead of storyId
          uniqueId: uniqueId, // Include unique ID for identification
          title: storyDataState.storyTitle,
          publisherName: storyDataState.publisherName,
          publisherPic: storyDataState.publisherPic,
          largeThumbnail: storyDataState.thumbnail,
          smallThumbnail: storyDataState.thumbnail,
          ctaType: storyDataState.ctaType || undefined,
          ctaValue: storyDataState.ctaValue || undefined,
          format: storyDataState.format,
          deviceFrame: storyDataState.deviceFrame,
        },
        frames: frames.map((frame, index) => ({
          ...frame,
          order: index + 1, // Ensure proper ordering
        })),
      }

      // Debug: Log the data being sent
      console.log('Saving story data:', JSON.stringify(storyData, null, 2))
      console.log(
        'Frames with types and ad configs:',
        frames.map((frame) => ({
          id: frame.id,
          type: frame.type,
          adConfig: frame.adConfig,
          background: frame.background,
        }))
      )

      // Save to backend
      const response = await storyAPI.saveCompleteStory(storyData)

      if (response.success) {
        toast.success('Story saved successfully!')
      } else {
        toast.error('Failed to save story')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save story')
    } finally {
      setIsSaving(false)
    }
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
      isSaving={isSaving}
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
        onCreateAutomatedStory={createAutomatedStory}
      />

      <EditorCanvas
        elements={selectedFrame?.elements || []}
        frameType={selectedFrame?.type}
        background={selectedFrame?.background}
        adConfig={selectedFrame?.adConfig}
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
        format={storyDataState.format}
        deviceFrame={storyDataState.deviceFrame}
      />

      <PropertyPanel
        selectedElement={
          selectedElementId === 'background'
            ? undefined
            : selectedElement
              ? { ...selectedElement }
              : selectedFrame?.type === 'ad'
                ? {
                    id: selectedFrame.id,
                    type: 'ad',
                    adConfig: selectedFrame.adConfig,
                  }
                : undefined
        }
        background={selectedFrame?.background}
        onElementUpdate={updateElement}
        onBackgroundUpdate={updateBackground}
        onElementRemove={removeElement}
        onFrameUpdate={(frameId: string, updates: any) => {
          setFrames((prev) =>
            prev.map((frame) =>
              frame.id === frameId ? { ...frame, ...updates } : frame
            )
          )
        }}
      />
      <EmbedModal
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        storyId={uniqueId || storyDataState?.storyTitle || 'demo'}
        storyData={{ story: storyDataState, frames }}
      />
    </EditorLayout>
  )
}

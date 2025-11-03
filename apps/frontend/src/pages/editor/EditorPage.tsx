import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useLocation, useParams } from 'react-router-dom'
import EditorLayout from './EditorLayout'
import EditorSidebar from './components/EditorSidebar'
import EditorCanvas from './components/EditorCanvas'
import PropertyPanel from './components/propertyPanel'
import EmbedModal from './components/EmbedModal'
import RSSUpdateTimer from '@/components/RSSUpdateTimer'
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
  name?: string
  link?: string // Optional link URL for the frame
  linkText?: string // Optional link text for the frame
  durationMs?: number
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
  defaultDurationMs?: number
}

declare global {
  interface Window {
    previewData?: any
  }
}

// Generate UUID for local-only frames (fallback if crypto.randomUUID not available)
function generateLocalId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback: simple random string
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
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
      defaultDurationMs: 2500,
    }
  )
  const fromCreate = location.state?.fromCreate || false
  const storyId = location.state?.storyId

  // Start with empty frames - will be populated when story loads
  const [frames, setFrames] = useState<StoryFrame[]>([])
  const [selectedFrameId, setSelectedFrameId] = useState<string>('')
  const [selectedElementId, setSelectedElementId] = useState<string>('')
  const [embedOpen, setEmbedOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [_isLoading, setIsLoading] = useState(false)
  const [currentStoryId, setCurrentStoryId] = useState<string | undefined>(
    storyId
  )
  const [isDynamicStory, setIsDynamicStory] = useState(false)
  const [rssConfig, setRssConfig] = useState<any>(null)

  // Load story function
  const loadStory = async () => {
    // Load story if:
    // 1. uniqueId is provided AND not from create (normal edit flow)
    // 2. OR uniqueId is provided AND coming from RSS processing (isDynamic)
    const shouldLoadStory =
      uniqueId && (!fromCreate || location.state?.isDynamic)
    if (shouldLoadStory) {
      try {
        setIsLoading(true)
        const response = await storyAPI.getStoryByUniqueId(uniqueId)

        if (response.success && response.data) {
          const story = response.data

          // Set the story ID for saving
          setCurrentStoryId(story.id)

          // Check if this is a dynamic story
          setIsDynamicStory(story.storyType === 'dynamic')
          if (story.storyType === 'dynamic' && story.rssConfig) {
            setRssConfig(story.rssConfig)
          }

          // Update story data
          setStoryDataState({
            storyTitle: story.title,
            publisherName: story.publisherName,
            publisherPic: story.publisherPic || '',
            thumbnail: '',
            background: '',
            ctaType: story.ctaType as any,
            ctaValue: story.ctaValue || '',
            format: (story.format as 'portrait' | 'landscape') || 'portrait',
            deviceFrame:
              (story.deviceFrame as 'mobile' | 'video-player') || 'mobile',
            defaultDurationMs: (story as any).defaultDurationMs || 2500,
          })

          // Convert database frames to editor frames
          if (story.frames && story.frames.length > 0) {
            console.log('Loaded frames from backend:', story.frames)
            const editorFrames = story.frames.map((frame: any) => {
              console.log('Mapping frame from backend:', {
                frameId: frame.id,
                frameName: frame.name,
                frameLink: frame.link,
                frameLinkText: frame.linkText,
                hasLink: !!frame.link,
                hasLinkText: !!frame.linkText,
              })
              return {
                id: frame.id,
                order: frame.order,
                type: frame.type || 'story',
                elements: frame.elements || [],
                hasContent: frame.hasContent,
                name: frame.name,
                link: frame.link, // Add frame link from database
                linkText: frame.linkText, // Add frame linkText from database
                durationMs: frame.durationMs ?? 2500,
                adConfig: frame.adConfig,
                background: frame.background
                  ? {
                      type: frame.background.type as
                        | 'color'
                        | 'image'
                        | 'video',
                      value: frame.background.value,
                      opacity: frame.background.opacity ?? 100,
                      rotation: frame.background.rotation ?? 0,
                      zoom: frame.background.zoom ?? 100,
                      filter: frame.background.filter,
                      offsetX: frame.background.offsetX ?? 0,
                      offsetY: frame.background.offsetY ?? 0,
                    }
                  : undefined,
              }
            })

            console.log('Editor frames after mapping:', editorFrames)
            if (editorFrames.length > 0) {
              console.log('First editor frame:', {
                id: editorFrames[0].id,
                name: editorFrames[0].name,
                link: editorFrames[0].link,
                linkText: editorFrames[0].linkText,
                hasLink: !!editorFrames[0].link,
                hasLinkText: !!editorFrames[0].linkText,
              })
            }

            setFrames(editorFrames)
            if (editorFrames.length > 0) {
              setSelectedFrameId(editorFrames[0].id)
            }
          }
        }
      } catch (error) {
        console.error('Error loading story:', error)
        toast.error('Failed to load story')
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Update initial frame when coming from create page
  useEffect(() => {
    if (
      fromCreate &&
      location.state?.storyData?.thumbnail &&
      frames.length > 0 &&
      selectedFrameId
    ) {
      setFrames((prev) =>
        prev.map((frame) =>
          frame.id === selectedFrameId
            ? {
                ...frame,
                background: {
                  type: 'image' as const,
                  value: location.state.storyData.thumbnail,
                  opacity: 100,
                  zoom: 100,
                  rotation: 0,
                  offsetX: 0,
                  offsetY: 0,
                },
              }
            : frame
        )
      )
    }
  }, [fromCreate, location.state?.storyData?.thumbnail, selectedFrameId])

  // Persist local-only frames (UUIDs that aren't database IDs) when story is saved
  useEffect(() => {
    const persistLocalFramesIfNeeded = async () => {
      if (!currentStoryId) return

      // Check if any frame has a UUID that doesn't match database ID format
      // Database IDs are cuid-like (typically start with 'c' and are 25 chars)
      const localFrames = frames.filter((f) => {
        // Database IDs: cuid format (starts with 'c' + 24 alphanumeric) or similar
        const isDbId = typeof f.id === 'string' && /^c[a-z0-9]{24}$/i.test(f.id)
        return !isDbId && f.id.length > 10 // UUIDs are longer, exclude very short IDs
      })

      if (localFrames.length === 0) return

      try {
        const updatedFrames: StoryFrame[] = [...frames]
        for (const local of localFrames) {
          const resp = await storyAPI.createStoryFrame(currentStoryId, {
            order: local.order,
            hasContent: local.hasContent,
            name: (local as any).name ?? null,
            link: (local as any).link ?? null,
            linkText: (local as any).linkText ?? null,
            durationMs: local.durationMs ?? 2500,
          } as any)
          const realId =
            (resp as any)?.data?.id || (resp as any)?.data?.frame?.id
          if (realId) {
            const idx = updatedFrames.findIndex((f) => f.id === local.id)
            if (idx >= 0) {
              updatedFrames[idx] = { ...updatedFrames[idx], id: realId }
              if (selectedFrameId === local.id) setSelectedFrameId(realId)
            }
          }
        }
        setFrames(updatedFrames)
        if (localFrames.length > 0) {
          toast.success('Local frames saved to server')
        }
      } catch (error) {
        console.warn('Failed to persist local frames:', error)
        // Will be saved on full story save
      }
    }

    persistLocalFramesIfNeeded()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoryId])

  // Load story data if uniqueId is provided in URL
  // Always load when uniqueId exists (on page reload, URL navigation, etc.)
  useEffect(() => {
    const loadStory = async () => {
      // Always load story when uniqueId is provided (from URL params)
      // This handles page reloads where location.state is lost
      if (uniqueId) {
        try {
          setIsLoading(true)
          const response = await storyAPI.getStoryByUniqueId(uniqueId)

          if (response.success && response.data) {
            const story = response.data

            // Set the story ID for saving
            setCurrentStoryId(story.id)

            // Check if this is a dynamic story
            setIsDynamicStory(story.storyType === 'dynamic')
            if (story.storyType === 'dynamic' && story.rssConfig) {
              setRssConfig(story.rssConfig)
            }

            // Update story data
            setStoryDataState({
              storyTitle: story.title,
              publisherName: story.publisherName,
              publisherPic: story.publisherPic || '',
              thumbnail: '',
              background: '',
              ctaType: story.ctaType as any,
              ctaValue: story.ctaValue || '',
              format: (story.format as 'portrait' | 'landscape') || 'portrait',
              deviceFrame:
                (story.deviceFrame as 'mobile' | 'video-player') || 'mobile',
              defaultDurationMs: (story as any).defaultDurationMs || 2500,
            })

            // Convert database frames to editor frames
            if (story.frames && story.frames.length > 0) {
              console.log('Loaded frames from backend:', story.frames)
              const editorFrames = story.frames.map((frame: any) => ({
                id: frame.id,
                order: frame.order,
                type: frame.type || 'story',
                elements: frame.elements || [],
                hasContent: frame.hasContent,
                name: frame.name,
                link: frame.link, // Add frame link from database
                linkText: frame.linkText, // Add frame linkText from database
                durationMs: frame.durationMs ?? 2500,
                adConfig: frame.adConfig,
                background: frame.background
                  ? {
                      type: frame.background.type as
                        | 'color'
                        | 'image'
                        | 'video',
                      value: frame.background.value,
                      opacity: frame.background.opacity ?? 100, // Use 100 as default if not set
                      rotation: frame.background.rotation ?? 0,
                      zoom: frame.background.zoom ?? 100, // Default zoom at 100%
                      filter: frame.background.filter,
                      offsetX: frame.background.offsetX ?? 0,
                      offsetY: frame.background.offsetY ?? 0,
                    }
                  : {
                      type: 'color' as const,
                      value:
                        'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
                      opacity: 100, // Set default opacity to 100
                    },
              }))

              setFrames(editorFrames)
              setSelectedFrameId(editorFrames[0]?.id || '')
            } else {
              // If no frames exist and we have a story, create a default frame on backend
              if (currentStoryId) {
                try {
                  const response = await storyAPI.createStoryFrame(
                    currentStoryId,
                    {
                      order: 0,
                      hasContent: false,
                      name: null as any,
                      link: null as any,
                      linkText: null as any,
                      durationMs: 2500,
                    } as any
                  )
                  const realId =
                    (response as any)?.data?.id ||
                    (response as any)?.data?.frame?.id
                  if (realId) {
                    const defaultFrame: StoryFrame = {
                      id: realId,
                      order: 1,
                      type: 'story',
                      elements: [],
                      hasContent: false,
                      durationMs: 2500,
                      background: {
                        type: 'color' as const,
                        value:
                          'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
                        opacity: 100,
                      },
                    }
                    setFrames([defaultFrame])
                    setSelectedFrameId(defaultFrame.id)
                  }
                } catch (error) {
                  console.error('Failed to create default frame:', error)
                  // Continue without default frame - user can add one manually
                }
              }
            }

            // Show success message
            if (location.state?.isDynamic && fromCreate) {
              toast.success(
                `RSS feed processed! Loaded ${story.frames?.length || 0} frames for "${story.title}"`
              )
            } else {
              toast.success(`Loaded story: ${story.title}`)
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueId]) // Always load when uniqueId changes (handles page reloads)

  // Show welcome message if coming from create page
  // Only show for static stories (dynamic stories show message after loading)
  useEffect(() => {
    if (fromCreate && storyDataState && !location.state?.isDynamic) {
      toast.success(
        `Welcome to the editor! You can now customize your story "${storyDataState.storyTitle}"`
      )
    }
  }, [fromCreate, storyDataState, location.state?.isDynamic])

  const addNewFrame = (frameType: 'story' | 'ad' = 'story') => {
    const createLocalFrame = (id: string): StoryFrame => ({
      id,
      order: frames.length + 1,
      type: frameType,
      elements: [],
      hasContent: false,
      durationMs: 2500,
      background:
        frameType === 'story'
          ? {
              type: 'color',
              value:
                'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
              opacity: 100,
              zoom: 100,
              rotation: 0,
              offsetX: 0,
              offsetY: 0,
            }
          : undefined,
      adConfig:
        frameType === 'ad'
          ? {
              adId: `/ad-${Date.now()}`,
              adUnitPath: '/6355419/Travel/Europe/France/Paris',
              size: [300, 250],
            }
          : undefined,
    })

    // Best practice: Always create on backend first if storyId exists
    if (currentStoryId) {
      ;(async () => {
        try {
          const response = await storyAPI.createStoryFrame(currentStoryId, {
            order: frames.length + 1,
            hasContent: false,
            name: null as any,
            link: null as any,
            linkText: null as any,
            durationMs: 2500,
          } as any)

          const realId =
            (response as any)?.data?.id || (response as any)?.data?.frame?.id
          if (!realId) {
            throw new Error('No frame ID returned from server')
          }

          const created = createLocalFrame(realId)
          setFrames((prev) => [...prev, created])
          setSelectedFrameId(created.id)
          setSelectedElementId('')
          toast.success(`New ${frameType} frame added!`)
        } catch (error) {
          console.error('Failed to create frame on server:', error)
          toast.error('Failed to create frame on server. Please try again.')
        }
      })()
      return
    }

    // Story not saved yet: use UUID for local-only frame
    // Will be created on backend when story is saved
    const localId = generateLocalId()
    const localFrame = createLocalFrame(localId)
    setFrames((prev) => [...prev, localFrame])
    setSelectedFrameId(localFrame.id)
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
        name: frameToDuplicate.name
          ? `${frameToDuplicate.name} (Copy)`
          : undefined,
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

  const renameFrame = (frameId: string, newName: string) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === frameId ? { ...frame, name: newName } : frame
      )
    )
    toast.success('Frame renamed!')
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
            x: 50, // Position from left edge - more margin
            y: 100, // Position from top edge - more margin
            width: 500, // Wider to accommodate longer text
            height: 200, // Taller to accommodate wrapped text
            content: headline,
            style: {
              fontSize: 24, // Slightly smaller default font size
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
        ],
        hasContent: true,
        background: {
          type: 'image' as const,
          value: image.url,
          opacity: 100,
          zoom: 100, // Default zoom at 100% (1.0x scale)
          rotation: 0,
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
      prev.map((frame) => {
        if (frame.id === selectedFrameId) {
          const updatedFrame = {
            ...frame,
            elements: [...frame.elements, element],
            hasContent: true,
          }

          // Auto-name frame if it's a text element and frame doesn't have a custom name
          if (element.type === 'text' && element.content && !frame.name) {
            const textContent = element.content.trim()
            if (textContent && textContent !== 'Double click to edit') {
              updatedFrame.name =
                textContent.length > 30
                  ? textContent.substring(0, 30) + '...'
                  : textContent
            }
          }

          return updatedFrame
        }
        return frame
      })
    )
  }

  const updateElement = (
    elementId: string,
    updates: Partial<CanvasElement>
  ) => {
    setFrames((prev) =>
      prev.map((frame) => {
        if (frame.id === selectedFrameId) {
          const updatedFrame = {
            ...frame,
            elements: frame.elements.map((element) =>
              element.id === elementId
                ? {
                    ...element,
                    ...updates,
                    // Properly merge style properties instead of replacing
                    style: {
                      ...element.style,
                      ...updates.style,
                    },
                  }
                : element
            ),
          }

          // Auto-name frame if text content is updated and frame doesn't have a custom name
          if (updates.content && updates.type === 'text' && !frame.name) {
            const textContent = updates.content.trim()
            if (textContent && textContent !== 'Double click to edit') {
              updatedFrame.name =
                textContent.length > 30
                  ? textContent.substring(0, 30) + '...'
                  : textContent
            }
          }

          return updatedFrame
        }
        return frame
      })
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
          defaultDurationMs: storyDataState.defaultDurationMs || 2500,
        },
        frames: frames.map((frame, index) => ({
          ...frame,
          order: index + 1, // Ensure proper ordering
        })),
      }

      // Debug: Log the data being sent
      console.log('Saving story data:', JSON.stringify(storyData, null, 2))
      console.log(
        'Frames with types, names, and ad configs:',
        frames.map((frame) => ({
          id: frame.id,
          name: frame.name,
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
      onPreview={handlePreview}
      onEmbed={handleEmbed}
      storyTitle={storyDataState?.storyTitle}
      isSaving={isSaving}
      rssTimer={
        isDynamicStory && rssConfig && currentStoryId ? (
          <RSSUpdateTimer
            storyId={currentStoryId}
            rssConfig={rssConfig}
            onUpdateTriggered={() => {
              // Refresh story data when RSS update is triggered
              if (uniqueId) {
                loadStory()
              }
            }}
            variant="navbar"
          />
        ) : undefined
      }
    >
      <EditorSidebar
        frames={frames}
        selectedFrameId={selectedFrameId}
        onAddFrame={addNewFrame}
        onRemoveFrame={removeFrame}
        onDuplicateFrame={duplicateFrame}
        onRenameFrame={renameFrame}
        onSelectFrame={(frameId) => {
          setSelectedFrameId(frameId)
          setSelectedElementId('')
        }}
        onReorderFrames={(reorderedIds) => {
          // Reorder frames by id list and reassign order
          setFrames((prev) => {
            const byId: Record<string, StoryFrame> = Object.fromEntries(
              prev.map((f) => [f.id, f])
            )
            const reordered: StoryFrame[] = []
            reorderedIds.forEach((id, idx) => {
              const original = byId[id]
              if (original) {
                reordered.push({ ...original, order: idx + 1 })
              }
            })
            // Append any frames not included (safety)
            prev.forEach((f) => {
              if (!reordered.find((r) => r.id === f.id)) {
                reordered.push({ ...f, order: reordered.length + 1 })
              }
            })
            return reordered
          })
        }}
        onAddElement={addElement}
        onCreateAutomatedStory={createAutomatedStory}
      />

      <EditorCanvas
        elements={selectedFrame?.elements || []}
        frameType={selectedFrame?.type}
        background={selectedFrame?.background}
        adConfig={selectedFrame?.adConfig}
        link={selectedFrame?.link}
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
        isDynamicStory={isDynamicStory}
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
                    durationMs: selectedFrame.durationMs ?? 2500,
                  }
                : selectedFrame && !selectedElement
                  ? (() => {
                      console.log('Creating selectedElement for frame:', {
                        frameId: selectedFrame.id,
                        frameName: selectedFrame.name,
                        frameLink: selectedFrame.link,
                        frameLinkText: selectedFrame.linkText,
                      })
                      console.log('Full selectedFrame object:', selectedFrame)
                      // Compute display name same as sidebar
                      const idx = frames.findIndex(
                        (f) => f.id === selectedFrame.id
                      )
                      const displayName = selectedFrame.name
                        ? selectedFrame.name
                        : `${`${selectedFrame.type}` === 'ad' ? 'Ad Frame' : 'Story Frame'} ${
                            (idx >= 0 ? idx : 0) + 1
                          }`

                      return {
                        id: selectedFrame.id,
                        type: 'frame',
                        name: selectedFrame.name ?? undefined,
                        displayName,
                        order: selectedFrame.order,
                        link: selectedFrame.link ?? undefined,
                        linkText: selectedFrame.linkText ?? undefined,
                        frameType: selectedFrame.type,
                        durationMs: selectedFrame.durationMs ?? 2500,
                      }
                    })()
                  : undefined
        }
        background={selectedFrame?.background}
        onElementUpdate={updateElement}
        onBackgroundUpdate={updateBackground}
        onElementRemove={removeElement}
        onFrameUpdate={async (frameId: string, updates: any) => {
          console.log('onFrameUpdate called:', { frameId, updates })

          // Update local state immediately for UI responsiveness
          setFrames((prev) =>
            prev.map((frame) =>
              frame.id === frameId ? { ...frame, ...updates } : frame
            )
          )

          // Save to database
          try {
            // Check if this is a database ID (cuid format: starts with 'c' + 24 alphanumeric)
            // Also accept UUIDs that were persisted, or any string that looks like a database ID
            const isDatabaseId =
              typeof frameId === 'string' &&
              frameId.length >= 10 &&
              (/^c[a-z0-9]{24}$/i.test(frameId) || // CUID format
                /^[a-z0-9]{25,}$/i.test(frameId)) // Other database ID formats

            console.log('Frame ID validation:', {
              frameId,
              isDatabaseId,
              length: frameId.length,
              isCuid: /^c[a-z0-9]{24}$/i.test(frameId),
            })

            if (!isDatabaseId) {
              // This is a local-only frame (UUID or not yet persisted)
              // Will be persisted when story is saved, or when storyId becomes available
              console.info(
                'Frame update deferred (local-only frame); will persist on story save:',
                frameId
              )
              return
            }

            // Whitelist payload to expected fields only
            const payload: any = {}
            if (Object.prototype.hasOwnProperty.call(updates, 'name'))
              payload.name = updates.name || null // Allow empty string but convert to null for backend
            if (Object.prototype.hasOwnProperty.call(updates, 'link'))
              payload.link = updates.link || null
            if (Object.prototype.hasOwnProperty.call(updates, 'linkText'))
              payload.linkText = updates.linkText || null
            if (Object.prototype.hasOwnProperty.call(updates, 'durationMs'))
              payload.durationMs = updates.durationMs

            console.log('Sending frame update to API:', { frameId, payload })
            await storyAPI.updateStoryFrame(frameId, payload)
            console.log('Frame update successful')
          } catch (error) {
            console.error('Failed to save frame update:', error)
            toast.error('Failed to save frame update')
            // Revert local state on error
            setFrames((prev) =>
              prev.map((frame) => {
                if (frame.id === frameId) {
                  const originalFrame = frames.find((f) => f.id === frameId)
                  return originalFrame || frame
                }
                return frame
              })
            )
          }
        }}
        storyDefaultDurationMs={storyDataState.defaultDurationMs}
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

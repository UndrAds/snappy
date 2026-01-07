import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Image,
  Type,
  Plus,
  Trash2,
  Copy,
  Globe,
  Megaphone,
  Edit2,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import MediaSourcePicker from './MediaSourcePicker'
import AutomatedStoryCreator from './AutomatedStoryCreator'

interface EditorSidebarProps {
  onAddFrame: (frameType: 'story' | 'ad') => void
  onRemoveFrame: (frameId: string) => void
  onDuplicateFrame: (frameId: string) => void
  onSelectFrame: (frameId: string) => void
  onReorderFrames: (reorderedIds: string[]) => void
  onRenameFrame: (frameId: string, newName: string) => void
  onAddElement: (element: any) => void
  onCreateAutomatedStory: (content: {
    headlines: string[]
    images: Array<{
      url: string
      alt: string
    }>
  }) => void
  frames: Array<{
    id: string
    order: number
    type: 'story' | 'ad'
    hasContent: boolean
    name?: string
  }>
  selectedFrameId: string
}

export default function EditorSidebar({
  onAddFrame,
  onRemoveFrame,
  onDuplicateFrame,
  onSelectFrame,
  onReorderFrames,
  onRenameFrame,
  onAddElement,
  onCreateAutomatedStory,
  frames,
  selectedFrameId,
}: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState('frames')
  const [automatedCreatorOpen, setAutomatedCreatorOpen] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAddElement = (type: 'text' | 'shape' | 'image') => {
    const newElement = {
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
        color: '#ffffff',
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

    onAddElement(newElement)
    toast.success(
      `${type.charAt(0).toUpperCase() + type.slice(1)} element added!`
    )
  }

  const handleAutomatedContentSelected = (content: {
    headlines: string[]
    images: Array<{
      url: string
      alt: string
    }>
  }) => {
    onCreateAutomatedStory(content)
    setAutomatedCreatorOpen(false)
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain') || draggingId
    if (!sourceId || sourceId === targetId) return

    const current = [...frames]
    const fromIndex = current.findIndex((f) => f.id === sourceId)
    const toIndex = current.findIndex((f) => f.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const updated = [...current]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)

    onReorderFrames(updated.map((f) => f.id))
    setDraggingId(null)
  }

  const handleStartRename = (frameId: string, currentName: string) => {
    setEditingFrameId(frameId)
    setEditingName(currentName)
  }

  const handleSaveRename = () => {
    if (editingFrameId && editingName.trim()) {
      onRenameFrame(editingFrameId, editingName.trim())
      setEditingFrameId(null)
      setEditingName('')
    }
  }

  const handleCancelRename = () => {
    setEditingFrameId(null)
    setEditingName('')
  }

  const getFrameDisplayName = (frame: any) => {
    if (frame.name) {
      return frame.name.length > 20
        ? `${frame.name.substring(0, 20)}...`
        : frame.name
    }
    return `${frame.type === 'ad' ? 'Ad Frame' : 'Story Frame'} ${frame.order}`
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList className="grid w-full grid-cols-3 rounded-none border-b">
          <TabsTrigger value="frames" className="rounded-none">
            Frames
          </TabsTrigger>
          <TabsTrigger value="elements" className="rounded-none">
            Elements
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-none">
            Media
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {/* Frames Tab */}
          <TabsContent value="frames" className="m-0 flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Automated Story Creator */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => setAutomatedCreatorOpen(true)}
                    className="w-full justify-start"
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Create from Website
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Story Frames</h3>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="h-8 w-8 p-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onAddFrame('story')}>
                        <Image className="mr-2 h-4 w-4" />
                        Add Story Frame
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAddFrame('ad')}>
                        <Megaphone className="mr-2 h-4 w-4" />
                        Add Ad Frame
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="max-h-[600px] space-y-2 overflow-y-auto">
                  {frames.map((frame) => (
                    <div
                      key={frame.id}
                      className={`group relative cursor-move rounded-lg border-2 border-dashed p-3 transition-all hover:border-border ${
                        selectedFrameId === frame.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-muted/50'
                      } ${draggingId === frame.id ? 'opacity-60' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, frame.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, frame.id)}
                      onClick={() => onSelectFrame(frame.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-background">
                            {frame.type === 'ad' ? (
                              <Megaphone className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            ) : frame.hasContent ? (
                              <Image className="h-6 w-6 text-muted-foreground" />
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Empty
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            {editingFrameId === frame.id ? (
                              <div className="flex items-center space-x-1">
                                <Input
                                  value={editingName}
                                  onChange={(e) =>
                                    setEditingName(e.target.value)
                                  }
                                  className="h-6 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveRename()
                                    if (e.key === 'Escape') handleCancelRename()
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleSaveRename}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleCancelRename}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">
                                  {getFrameDisplayName(frame)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {frame.type === 'ad'
                                    ? 'Advertisement slot'
                                    : frame.hasContent
                                      ? 'Has content'
                                      : 'Empty frame'}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col space-y-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {editingFrameId !== frame.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStartRename(
                                  frame.id,
                                  getFrameDisplayName(frame)
                                )
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDuplicateFrame(frame.id)
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          {frames.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveFrame(frame.id)
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Elements Tab */}
          <TabsContent value="elements" className="m-0 flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Add Elements</h3>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="h-20 w-full flex-col space-y-2"
                    onClick={() => handleAddElement('text')}
                  >
                    <Type className="h-6 w-6" />
                    <span className="text-xs">Text</span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="m-0 flex h-full flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Media Library</h3>

                <MediaSourcePicker
                  type="image"
                  onChange={(url) => {
                    // Add as new image element using the image's intrinsic size
                    const img = new window.Image()
                    img.onload = () => {
                      onAddElement({
                        id: Date.now().toString(),
                        type: 'image',
                        x: 50,
                        y: 50,
                        width: img.naturalWidth,
                        height: img.naturalHeight,
                        mediaUrl: url,
                        style: {
                          opacity: 100,
                          rotation: 0,
                          filter: 'none',
                        },
                      })
                      toast.success('Image added!')
                    }
                    img.onerror = () => {
                      // Fallback to a reasonable default if dimensions can't be read
                      onAddElement({
                        id: Date.now().toString(),
                        type: 'image',
                        x: 50,
                        y: 50,
                        width: 400,
                        height: 300,
                        mediaUrl: url,
                        style: {
                          opacity: 100,
                          rotation: 0,
                          filter: 'none',
                        },
                      })
                      toast.success('Image added!')
                    }
                    img.src = url
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Automated Story Creator Modal */}
      {automatedCreatorOpen && (
        <AutomatedStoryCreator
          onContentSelected={handleAutomatedContentSelected}
          onClose={() => setAutomatedCreatorOpen(false)}
        />
      )}
    </div>
  )
}

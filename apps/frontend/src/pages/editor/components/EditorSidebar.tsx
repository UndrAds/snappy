import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Image,
  Type,
  Shapes,
  Palette,
  Plus,
  Trash2,
  Copy,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

interface EditorSidebarProps {
  onAddFrame: () => void
  onRemoveFrame: (frameId: string) => void
  onDuplicateFrame: (frameId: string) => void
  onSelectFrame: (frameId: string) => void
  onAddElement: (element: any) => void
  frames: Array<{
    id: string
    order: number
    hasContent: boolean
  }>
  selectedFrameId: string
}

export default function EditorSidebar({
  onAddFrame,
  onRemoveFrame,
  onDuplicateFrame,
  onSelectFrame,
  onAddElement,
  frames,
  selectedFrameId,
}: EditorSidebarProps) {
  const [activeTab, setActiveTab] = useState('frames')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileUpload = (file: File) => {
    const url = URL.createObjectURL(file)
    const newElement = {
      id: Date.now().toString(),
      type: 'image' as const,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
      mediaUrl: url,
      style: {
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
    toast.success('Image uploaded successfully!')
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }

      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error('Please select an image or video file')
        return
      }

      handleFileUpload(file)
    }
  }

  return (
    <div className="w-64 border-r bg-white">
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

        <div className="flex-1 overflow-y-auto">
          {/* Frames Tab */}
          <TabsContent value="frames" className="m-0 h-full">
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Story Frames</h3>
                <Button size="sm" onClick={onAddFrame} className="h-8 w-8 p-0">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                {frames.map((frame) => (
                  <div
                    key={frame.id}
                    className={`group relative cursor-pointer rounded-lg border-2 border-dashed p-3 transition-all hover:border-gray-400 ${
                      selectedFrameId === frame.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                    onClick={() => onSelectFrame(frame.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white">
                          {frame.hasContent ? (
                            <Image className="h-6 w-6 text-gray-600" />
                          ) : (
                            <div className="text-xs text-gray-400">Empty</div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">Frame {frame.order}</div>
                          <div className="text-xs text-muted-foreground">
                            {frame.hasContent ? 'Has content' : 'Empty frame'}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                            className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
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
          </TabsContent>

          {/* Elements Tab */}
          <TabsContent value="elements" className="m-0 h-full">
            <div className="space-y-4 p-4">
              <h3 className="text-sm font-semibold">Add Elements</h3>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleAddElement('text')}
                >
                  <Type className="h-6 w-6" />
                  <span className="text-xs">Text</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleAddElement('shape')}
                >
                  <Shapes className="h-6 w-6" />
                  <span className="text-xs">Shapes</span>
                </Button>

                <Button
                  variant="outline"
                  className="h-20 flex-col space-y-2"
                  onClick={() => handleAddElement('image')}
                >
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Image</span>
                </Button>

                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Palette className="h-6 w-6" />
                  <span className="text-xs">Background</span>
                </Button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground">
                  TEXT STYLES
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Type className="mr-2 h-4 w-4" />
                    Heading
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Type className="mr-2 h-4 w-4" />
                    Subheading
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Type className="mr-2 h-4 w-4" />
                    Body Text
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="m-0 h-full">
            <div className="space-y-4 p-4">
              <h3 className="text-sm font-semibold">Media Library</h3>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image/Video
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground">
                  RECENT
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="aspect-square rounded-lg bg-gray-200"></div>
                  <div className="aspect-square rounded-lg bg-gray-200"></div>
                  <div className="aspect-square rounded-lg bg-gray-200"></div>
                  <div className="aspect-square rounded-lg bg-gray-200"></div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

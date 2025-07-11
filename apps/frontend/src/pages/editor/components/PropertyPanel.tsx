import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Type,
  Image,
  Palette,
  Sun,
  Contrast,
  Droplets,
  Sparkles,
  Eye,
  Upload,
  Settings,
  Globe,
} from 'lucide-react'

interface PropertyPanelProps {
  selectedElement?: {
    type: 'text' | 'image' | 'shape'
    id: string
    style?: any
  }
  background?: {
    type: 'color' | 'image' | 'video'
    value: string
  }
  onElementUpdate?: (elementId: string, updates: any) => void
  onBackgroundUpdate?: (background: {
    type: 'color' | 'image' | 'video'
    value: string
  }) => void
}

// Color definitions
const textColors = [
  { name: 'Red', value: '#ef4444', bgClass: 'bg-red-500' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Green', value: '#22c55e', bgClass: 'bg-green-500' },
  { name: 'Yellow', value: '#eab308', bgClass: 'bg-yellow-500' },
  { name: 'Purple', value: '#a855f7', bgClass: 'bg-purple-500' },
  { name: 'White', value: '#ffffff', bgClass: 'bg-white' },
]

const shapeColors = [
  { name: 'Red', value: '#ef4444', bgClass: 'bg-red-500' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Green', value: '#22c55e', bgClass: 'bg-green-500' },
  { name: 'Yellow', value: '#eab308', bgClass: 'bg-yellow-500' },
  { name: 'Purple', value: '#a855f7', bgClass: 'bg-purple-500' },
  { name: 'Gray', value: '#6b7280', bgClass: 'bg-gray-500' },
]

const backgroundGradients = [
  {
    name: 'Purple Pink Orange',
    value: 'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
    bgClass: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500',
  },
  {
    name: 'Blue Purple',
    value: 'linear-gradient(to bottom right, #3b82f6, #8b5cf6)',
    bgClass: 'bg-gradient-to-br from-blue-500 to-purple-500',
  },
  {
    name: 'Green Blue',
    value: 'linear-gradient(to bottom right, #22c55e, #3b82f6)',
    bgClass: 'bg-gradient-to-br from-green-500 to-blue-500',
  },
  {
    name: 'Yellow Red',
    value: 'linear-gradient(to bottom right, #eab308, #ef4444)',
    bgClass: 'bg-gradient-to-br from-yellow-500 to-red-500',
  },
  {
    name: 'Pink Rose',
    value: 'linear-gradient(to bottom right, #ec4899, #f43f5e)',
    bgClass: 'bg-gradient-to-br from-pink-500 to-rose-500',
  },
  {
    name: 'Indigo Purple',
    value: 'linear-gradient(to bottom right, #6366f1, #a855f7)',
    bgClass: 'bg-gradient-to-br from-indigo-500 to-purple-500',
  },
  {
    name: 'Teal Cyan',
    value: 'linear-gradient(to bottom right, #14b8a6, #06b6d4)',
    bgClass: 'bg-gradient-to-br from-teal-500 to-cyan-500',
  },
  {
    name: 'Orange Red',
    value: 'linear-gradient(to bottom right, #f97316, #ef4444)',
    bgClass: 'bg-gradient-to-br from-orange-500 to-red-500',
  },
]

export default function PropertyPanel({
  selectedElement,
  background,
  onElementUpdate,
  onBackgroundUpdate,
}: PropertyPanelProps) {
  const [activeTab, setActiveTab] = useState('style')

  // Show effects tab only for media elements (images)
  const showEffectsTab = selectedElement?.type === 'image'

  // Color button component
  const ColorButton = ({
    color,
    onClick,
    size = 'h-8 w-8',
  }: {
    color: { name: string; value: string; bgClass: string }
    onClick: () => void
    size?: string
  }) => (
    <div
      className={`${size} cursor-pointer rounded border ${color.bgClass} transition-transform hover:scale-110`}
      onClick={onClick}
      title={color.name}
    />
  )

  return (
    <div className="w-80 border-l bg-white">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
        <TabsList
          className={`grid w-full rounded-none border-b ${
            showEffectsTab ? 'grid-cols-4' : 'grid-cols-3'
          }`}
        >
          <TabsTrigger value="style" className="rounded-none">
            Style
          </TabsTrigger>
          {showEffectsTab && (
            <TabsTrigger value="effects" className="rounded-none">
              Effects
            </TabsTrigger>
          )}
          <TabsTrigger value="global" className="rounded-none">
            Global
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          {/* Style Tab */}
          <TabsContent value="style" className="m-0 h-full">
            <div className="space-y-6 p-4">
              {selectedElement?.type === 'text' ? (
                <>
                  {/* Text Properties */}
                  <div className="space-y-4">
                    <h3 className="flex items-center text-sm font-semibold">
                      <Type className="mr-2 h-4 w-4" />
                      Text Properties
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Text Content</Label>
                        <Input
                          placeholder="Enter text..."
                          className="mt-1"
                          onChange={(e) =>
                            onElementUpdate?.(selectedElement.id, {
                              content: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Font Family</Label>
                        <Select
                          onValueChange={(value) =>
                            onElementUpdate?.(selectedElement.id, {
                              style: { fontFamily: value },
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Times New Roman">
                              Times New Roman
                            </SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Roboto">Roboto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Font Size</Label>
                        <Slider
                          value={[selectedElement.style?.fontSize || 16]}
                          max={72}
                          min={8}
                          step={1}
                          className="mt-2"
                          onValueChange={(value) =>
                            onElementUpdate?.(selectedElement.id, {
                              style: { fontSize: value[0] },
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Font Weight</Label>
                        <Select
                          onValueChange={(value) =>
                            onElementUpdate?.(selectedElement.id, {
                              style: { fontWeight: value },
                            })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select weight" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="light">Light</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Text Color</Label>
                        <div className="mt-1 flex space-x-2">
                          {textColors.map((color) => (
                            <ColorButton
                              key={color.value}
                              color={color}
                              onClick={() =>
                                onElementUpdate?.(selectedElement.id, {
                                  style: { color: color.value },
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : selectedElement?.type === 'image' ? (
                <>
                  {/* Image Properties */}
                  <div className="space-y-4">
                    <h3 className="flex items-center text-sm font-semibold">
                      <Image className="mr-2 h-4 w-4" />
                      Image Properties
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Opacity</Label>
                        <Slider
                          value={[selectedElement.style?.opacity || 100]}
                          max={100}
                          min={0}
                          step={1}
                          className="mt-2"
                          onValueChange={(value) =>
                            onElementUpdate?.(selectedElement.id, {
                              style: { opacity: value[0] },
                            })
                          }
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Rotation</Label>
                        <Slider
                          value={[selectedElement.style?.rotation || 0]}
                          max={360}
                          min={-360}
                          step={1}
                          className="mt-2"
                          onValueChange={(value) =>
                            onElementUpdate?.(selectedElement.id, {
                              style: { rotation: value[0] },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Shape Properties */}
                  <div className="space-y-4">
                    <h3 className="flex items-center text-sm font-semibold">
                      <Palette className="mr-2 h-4 w-4" />
                      Shape Properties
                    </h3>

                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Background Color</Label>
                        <div className="mt-1 flex space-x-2">
                          {shapeColors.map((color) => (
                            <ColorButton
                              key={color.value}
                              color={color}
                              onClick={() =>
                                onElementUpdate?.(selectedElement?.id || '', {
                                  style: { backgroundColor: color.value },
                                })
                              }
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Opacity</Label>
                        <Slider
                          value={[selectedElement?.style?.opacity || 100]}
                          max={100}
                          min={0}
                          step={1}
                          className="mt-2"
                          onValueChange={(value) =>
                            onElementUpdate?.(selectedElement?.id || '', {
                              style: { opacity: value[0] },
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Common Properties */}
              <div className="space-y-4">
                <h3 className="flex items-center text-sm font-semibold">
                  <Settings className="mr-2 h-4 w-4" />
                  Common Properties
                </h3>

                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Position X</Label>
                    <Input type="number" placeholder="0" className="mt-1" />
                  </div>

                  <div>
                    <Label className="text-xs">Position Y</Label>
                    <Input type="number" placeholder="0" className="mt-1" />
                  </div>

                  <div>
                    <Label className="text-xs">Width</Label>
                    <Input type="number" placeholder="100" className="mt-1" />
                  </div>

                  <div>
                    <Label className="text-xs">Height</Label>
                    <Input type="number" placeholder="100" className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Effects Tab - Only for media elements */}
          {showEffectsTab && (
            <TabsContent value="effects" className="m-0 h-full">
              <div className="space-y-6 p-4">
                <h3 className="text-sm font-semibold">
                  Media Effects & Filters
                </h3>

                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center text-xs">
                      <Sun className="mr-2 h-4 w-4" />
                      Brightness
                    </Label>
                    <Slider
                      value={[selectedElement?.style?.brightness || 50]}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-2"
                      onValueChange={(value) =>
                        onElementUpdate?.(selectedElement?.id || '', {
                          style: { brightness: value[0] },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="flex items-center text-xs">
                      <Contrast className="mr-2 h-4 w-4" />
                      Contrast
                    </Label>
                    <Slider
                      value={[selectedElement?.style?.contrast || 50]}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-2"
                      onValueChange={(value) =>
                        onElementUpdate?.(selectedElement?.id || '', {
                          style: { contrast: value[0] },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="flex items-center text-xs">
                      <Droplets className="mr-2 h-4 w-4" />
                      Saturation
                    </Label>
                    <Slider
                      value={[selectedElement?.style?.saturation || 50]}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-2"
                      onValueChange={(value) =>
                        onElementUpdate?.(selectedElement?.id || '', {
                          style: { saturation: value[0] },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="flex items-center text-xs">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Sharpness
                    </Label>
                    <Slider
                      defaultValue={[50]}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="flex items-center text-xs">
                      <Eye className="mr-2 h-4 w-4" />
                      Highlights
                    </Label>
                    <Slider
                      defaultValue={[50]}
                      max={100}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Filters Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold">Image Filters</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-gray-200"></div>
                      <span className="text-xs">None</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-gray-300"></div>
                      <span className="text-xs">Grayscale</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-blue-200"></div>
                      <span className="text-xs">Cool</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-yellow-200"></div>
                      <span className="text-xs">Warm</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-purple-200"></div>
                      <span className="text-xs">Vintage</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-pink-200"></div>
                      <span className="text-xs">Pink</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-green-200"></div>
                      <span className="text-xs">Nature</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-orange-200"></div>
                      <span className="text-xs">Sunset</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-16 flex-col"
                    >
                      <div className="mb-1 h-8 w-8 rounded bg-red-200"></div>
                      <span className="text-xs">Drama</span>
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Global Tab */}
          <TabsContent value="global" className="m-0 h-full">
            <div className="space-y-4 p-4">
              <h3 className="flex items-center text-sm font-semibold">
                <Globe className="mr-2 h-4 w-4" />
                Global Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Background Type</Label>
                  <Select
                    value={background?.type || 'color'}
                    onValueChange={(value) =>
                      onBackgroundUpdate?.({
                        type: value as 'color' | 'image' | 'video',
                        value:
                          background?.value ||
                          'linear-gradient(to bottom right, #8b5cf6, #ec4899, #f97316)',
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color/Gradient</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {background?.type === 'color' && (
                  <div>
                    <Label className="text-xs">Background Color</Label>
                    <div className="mt-2 grid grid-cols-4 gap-2">
                      {backgroundGradients.map((gradient) => (
                        <div
                          key={gradient.value}
                          className={`h-12 w-full cursor-pointer rounded border ${gradient.bgClass} transition-transform hover:scale-105`}
                          onClick={() =>
                            onBackgroundUpdate?.({
                              type: 'color',
                              value: gradient.value,
                            })
                          }
                          title={gradient.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {background?.type === 'image' && (
                  <div>
                    <Label className="text-xs">Background Image</Label>
                    <div className="mt-2">
                      <Button variant="outline" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Image
                      </Button>
                    </div>
                  </div>
                )}

                {background?.type === 'video' && (
                  <div>
                    <Label className="text-xs">Background Video</Label>
                    <div className="mt-2">
                      <Button variant="outline" className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Video
                      </Button>
                    </div>
                  </div>
                )}

                {/* Additional Global Settings */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold">Story Settings</h4>

                  <div>
                    <Label className="text-xs">Story Duration (seconds)</Label>
                    <Input type="number" placeholder="5" className="mt-1" />
                  </div>

                  <div>
                    <Label className="text-xs">Auto Advance</Label>
                    <Select defaultValue="enabled">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">Transition Effect</Label>
                    <Select defaultValue="slide">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slide">Slide</SelectItem>
                        <SelectItem value="fade">Fade</SelectItem>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

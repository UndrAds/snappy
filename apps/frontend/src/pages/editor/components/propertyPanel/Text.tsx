import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Type, RotateCcw, Slash } from 'lucide-react'
import PropertyControl from './PropertyControl'
import { propertyControlsConfig } from './config'

const textColors = [
  { name: 'Red', value: '#ef4444', bgClass: 'bg-red-500' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Green', value: '#22c55e', bgClass: 'bg-green-500' },
  { name: 'Yellow', value: '#eab308', bgClass: 'bg-yellow-500' },
  { name: 'Purple', value: '#a855f7', bgClass: 'bg-purple-500' },
  { name: 'White', value: '#ffffff', bgClass: 'bg-white' },
  { name: 'Black', value: '#000000', bgClass: 'bg-black' },
]

const backgroundColors = [
  {
    name: 'Transparent',
    value: 'transparent',
    bgClass: 'bg-transparent border-2 border-gray-300',
  },
  { name: 'Black', value: 'rgba(0, 0, 0, 0.8)', bgClass: 'bg-black' },
  { name: 'Dark Gray', value: 'rgba(0, 0, 0, 0.6)', bgClass: 'bg-gray-800' },
  { name: 'White', value: 'rgba(255, 255, 255, 0.9)', bgClass: 'bg-white' },
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.8)', bgClass: 'bg-blue-500' },
  { name: 'Red', value: 'rgba(239, 68, 68, 0.8)', bgClass: 'bg-red-500' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.8)', bgClass: 'bg-green-500' },
  {
    name: 'Purple',
    value: 'rgba(168, 85, 247, 0.8)',
    bgClass: 'bg-purple-500',
  },
]

export default function PropertyPanelText({ element, onElementUpdate }: any) {
  if (!element) return null

  // Helper function to properly merge style updates
  const updateStyle = (styleUpdate: any) => {
    onElementUpdate?.(element.id, {
      style: { ...element.style, ...styleUpdate },
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center text-sm font-semibold">
        <Type className="mr-2 h-4 w-4" />
        Text Properties
      </h3>
      <div className="space-y-3">
        {/* Text-specific controls */}
        <div>
          <Label className="text-xs">Text Content</Label>
          <Input
            placeholder="Enter text..."
            className="mt-1"
            value={element.content || ''}
            onChange={(e) =>
              onElementUpdate?.(element.id, {
                content: e.target.value,
              })
            }
          />
          {/* Removed Text Preview */}
        </div>
        <div>
          <Label className="text-xs">Font Family</Label>
          <Select
            value={element.style?.fontFamily}
            onValueChange={(value) => updateStyle({ fontFamily: value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial">Arial</SelectItem>
              <SelectItem value="Helvetica">Helvetica</SelectItem>
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Font Size</Label>
          <div className="mt-1 flex items-center gap-2">
            <Slider
              value={[element.style?.fontSize || 16]}
              max={72}
              min={8}
              step={1}
              className="flex-1"
              onValueChange={(value) => updateStyle({ fontSize: value[0] })}
            />
            <span className="min-w-[30px] text-center text-xs text-gray-500">
              {element.style?.fontSize || 16}px
            </span>
          </div>
        </div>
        <div>
          <Label className="text-xs">Font Weight</Label>
          <Select
            value={element.style?.fontWeight}
            onValueChange={(value) => updateStyle({ fontWeight: value })}
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
              <div
                key={color.value}
                className={`h-8 w-8 cursor-pointer rounded border ${color.bgClass} transition-transform hover:scale-110`}
                onClick={() => updateStyle({ color: color.value })}
                title={color.name}
              />
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Background Color</Label>
          <div className="mt-1 grid grid-cols-4 gap-2">
            {backgroundColors.map((color) => {
              const isSelected = element.style?.backgroundColor === color.value
              const commonClasses = `h-8 w-8 cursor-pointer rounded border transition-transform hover:scale-110 ${
                isSelected ? 'ring-2 ring-blue-500' : ''
              }`
              if (color.value === 'transparent') {
                return (
                  <div
                    key={color.value}
                    className={`${commonClasses} flex items-center justify-center bg-transparent`}
                    onClick={() =>
                      updateStyle({ backgroundColor: color.value })
                    }
                    title={color.name}
                  >
                    <Slash className="h-5 w-5 text-gray-500" />
                  </div>
                )
              }
              return (
                <div
                  key={color.value}
                  className={`${commonClasses} ${color.bgClass}`}
                  onClick={() => updateStyle({ backgroundColor: color.value })}
                  title={color.name}
                />
              )
            })}
          </div>
        </div>

        {/* Text Opacity Control */}
        <div>
          <Label className="text-xs">Text Opacity</Label>
          <div className="mt-1 flex items-center gap-2">
            <Slider
              value={[
                element.style?.textOpacity ?? element.style?.opacity ?? 100,
              ]}
              max={100}
              min={0}
              step={1}
              className="flex-1"
              onValueChange={(value) => updateStyle({ textOpacity: value[0] })}
            />
            <span className="min-w-[30px] text-center text-xs text-gray-500">
              {element.style?.textOpacity ?? element.style?.opacity ?? 100}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStyle({ textOpacity: 100 })}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Background Opacity Control */}
        <div>
          <Label className="text-xs">Background Opacity</Label>
          <div className="mt-1 flex items-center gap-2">
            <Slider
              value={[element.style?.backgroundOpacity ?? 100]}
              max={100}
              min={0}
              step={1}
              className="flex-1"
              onValueChange={(value) =>
                updateStyle({ backgroundOpacity: value[0] })
              }
            />
            <span className="min-w-[30px] text-center text-xs text-gray-500">
              {element.style?.backgroundOpacity ?? 100}%
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStyle({ backgroundOpacity: 100 })}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Other property controls (excluding opacity since we have separate controls now) */}
        {propertyControlsConfig.text
          .filter((ctrl) => ctrl.key !== 'opacity')
          .map((ctrl) => (
            <PropertyControl
              key={ctrl.key}
              label={ctrl.label}
              value={element.style?.[ctrl.key] ?? ctrl.default}
              min={ctrl.min}
              max={ctrl.max}
              step={ctrl.step}
              defaultValue={ctrl.default}
              icon={ctrl.icon}
              onChange={(val) => updateStyle({ [ctrl.key]: val })}
              onReset={() => updateStyle({ [ctrl.key]: ctrl.default })}
            />
          ))}
      </div>
    </div>
  )
}

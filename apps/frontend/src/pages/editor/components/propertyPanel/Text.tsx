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
import { Type } from 'lucide-react'
import PropertyControl from './PropertyControl'
import { propertyControlsConfig } from './config'

const textColors = [
  { name: 'Red', value: '#ef4444', bgClass: 'bg-red-500' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Green', value: '#22c55e', bgClass: 'bg-green-500' },
  { name: 'Yellow', value: '#eab308', bgClass: 'bg-yellow-500' },
  { name: 'Purple', value: '#a855f7', bgClass: 'bg-purple-500' },
  { name: 'White', value: '#ffffff', bgClass: 'bg-white' },
]

export default function PropertyPanelText({ element, onElementUpdate }: any) {
  if (!element) return null
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
        </div>
        <div>
          <Label className="text-xs">Font Family</Label>
          <Select
            value={element.style?.fontFamily}
            onValueChange={(value) =>
              onElementUpdate?.(element.id, {
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
              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              <SelectItem value="Georgia">Georgia</SelectItem>
              <SelectItem value="Roboto">Roboto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Font Size</Label>
          <Slider
            value={[element.style?.fontSize || 16]}
            max={72}
            min={8}
            step={1}
            className="mt-2"
            onValueChange={(value) =>
              onElementUpdate?.(element.id, {
                style: { fontSize: value[0] },
              })
            }
          />
        </div>
        <div>
          <Label className="text-xs">Font Weight</Label>
          <Select
            value={element.style?.fontWeight}
            onValueChange={(value) =>
              onElementUpdate?.(element.id, {
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
              <div
                key={color.value}
                className={`h-8 w-8 cursor-pointer rounded border ${color.bgClass} transition-transform hover:scale-110`}
                onClick={() =>
                  onElementUpdate?.(element.id, {
                    style: { color: color.value },
                  })
                }
                title={color.name}
              />
            ))}
          </div>
        </div>
        {/* Plug-and-play property controls */}
        {propertyControlsConfig.text.map((ctrl) => (
          <PropertyControl
            key={ctrl.key}
            label={ctrl.label}
            value={element.style?.[ctrl.key] ?? ctrl.default}
            min={ctrl.min}
            max={ctrl.max}
            step={ctrl.step}
            defaultValue={ctrl.default}
            icon={ctrl.icon}
            onChange={(val) =>
              onElementUpdate?.(element.id, {
                style: { [ctrl.key]: val },
              })
            }
            onReset={() =>
              onElementUpdate?.(element.id, {
                style: { [ctrl.key]: ctrl.default },
              })
            }
          />
        ))}
      </div>
    </div>
  )
}

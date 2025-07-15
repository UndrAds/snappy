import { Label } from '@/components/ui/label'
import { Palette } from 'lucide-react'
import PropertyControl from './PropertyControl'
import { propertyControlsConfig } from './propertyControlsConfig'

const shapeColors = [
  { name: 'Red', value: '#ef4444', bgClass: 'bg-red-500' },
  { name: 'Blue', value: '#3b82f6', bgClass: 'bg-blue-500' },
  { name: 'Green', value: '#22c55e', bgClass: 'bg-green-500' },
  { name: 'Yellow', value: '#eab308', bgClass: 'bg-yellow-500' },
  { name: 'Purple', value: '#a855f7', bgClass: 'bg-purple-500' },
  { name: 'Gray', value: '#6b7280', bgClass: 'bg-gray-500' },
]

export default function PropertyPanelShape({ element, onElementUpdate }: any) {
  if (!element) return null

  return (
    <div className="space-y-4">
      <h3 className="flex items-center text-sm font-semibold">
        <Palette className="mr-2 h-4 w-4" />
        Shape Properties
      </h3>
      <div className="space-y-3">
        {/* Shape-specific controls */}
        <div>
          <Label className="text-xs">Background Color</Label>
          <div className="mt-1 flex space-x-2">
            {shapeColors.map((color) => (
              <div
                key={color.value}
                className={`h-8 w-8 cursor-pointer rounded border ${color.bgClass} transition-transform hover:scale-110`}
                onClick={() =>
                  onElementUpdate?.(element.id, {
                    style: { backgroundColor: color.value },
                  })
                }
                title={color.name}
              />
            ))}
          </div>
        </div>
        {/* Plug-and-play property controls */}
        {propertyControlsConfig.shape.map((ctrl) => (
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

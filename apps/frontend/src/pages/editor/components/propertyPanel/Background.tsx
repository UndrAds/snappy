import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import BackgroundColorGradientPicker from '../ColorPicker'
import MediaSourcePicker from '../MediaSourcePicker'
import MediaSkin from '../MediaSkin'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import PropertyControl from './PropertyControl'
import { propertyControlsConfig } from './config'
import { useState, useEffect } from 'react'

export default function PropertyPanelBackground({
  background,
  onBackgroundUpdate,
}: any) {
  const [pendingType, setPendingType] = useState<'color' | 'image' | 'video'>(
    background?.type || 'image'
  )
  const [panXInput, setPanXInput] = useState(
    (background?.offsetX ?? 0).toString()
  )
  const [panYInput, setPanYInput] = useState(
    (background?.offsetY ?? 0).toString()
  )

  // Update input values when background changes
  useEffect(() => {
    setPanXInput((background?.offsetX ?? 0).toString())
    setPanYInput((background?.offsetY ?? 0).toString())
    // Keep the dropdown in sync with the actual background type
    if (background?.type && background.type !== pendingType) {
      setPendingType(background.type)
    }
  }, [background?.offsetX, background?.offsetY])

  const handlePanXInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setPanXInput(newValue)

    const numValue = parseFloat(newValue)
    if (!isNaN(numValue) && numValue >= -200 && numValue <= 200) {
      onBackgroundUpdate?.({
        ...background,
        offsetX: numValue,
      })
    }
  }

  const handlePanXInputBlur = () => {
    const numValue = parseFloat(panXInput)
    if (isNaN(numValue) || numValue < -200 || numValue > 200) {
      setPanXInput((background?.offsetX ?? 0).toString())
    }
  }

  const handlePanYInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setPanYInput(newValue)

    const numValue = parseFloat(newValue)
    if (!isNaN(numValue) && numValue >= -200 && numValue <= 200) {
      onBackgroundUpdate?.({
        ...background,
        offsetY: numValue,
      })
    }
  }

  const handlePanYInputBlur = () => {
    const numValue = parseFloat(panYInput)
    if (isNaN(numValue) || numValue < -200 || numValue > 200) {
      setPanYInput((background?.offsetY ?? 0).toString())
    }
  }

  if (!background) return null
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Background Properties</h3>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Background Type</Label>
          <Select
            value={pendingType}
            onValueChange={(value) => setPendingType(value as any)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="color">Gradient/Color</SelectItem>
              <SelectItem value="image">Image/Video</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {pendingType === 'color' && (
          <div>
            <BackgroundColorGradientPicker
              value={background.value}
              onSelect={(val) =>
                onBackgroundUpdate?.({
                  ...background,
                  type: 'color',
                  value: val,
                })
              }
            />
          </div>
        )}
        {pendingType === 'image' && (
          <>
            <div>
              <MediaSourcePicker
                type="image"
                value={background.value}
                onChange={(url) =>
                  onBackgroundUpdate?.({
                    ...background,
                    type: 'image',
                    value: url,
                  })
                }
              />
            </div>
            {/* Pan Controls */}
            <div className="flex items-center gap-2">
              <Label className="text-xs">Pan X</Label>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="number"
                  value={panXInput}
                  onChange={handlePanXInputChange}
                  onBlur={handlePanXInputBlur}
                  min={-200}
                  max={200}
                  step={1}
                  className="h-6 w-16 text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  title="Reset X"
                  onClick={() =>
                    onBackgroundUpdate?.({
                      ...background,
                      offsetX: 0,
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Slider
              value={[background.offsetX ?? 0]}
              max={200}
              min={-200}
              step={1}
              className="mt-2"
              onValueChange={(value) =>
                onBackgroundUpdate?.({
                  ...background,
                  offsetX: value[0],
                })
              }
            />
            <div className="flex items-center gap-2">
              <Label className="text-xs">Pan Y</Label>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="number"
                  value={panYInput}
                  onChange={handlePanYInputChange}
                  onBlur={handlePanYInputBlur}
                  min={-200}
                  max={200}
                  step={1}
                  className="h-6 w-16 text-xs"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  title="Reset Y"
                  onClick={() =>
                    onBackgroundUpdate?.({
                      ...background,
                      offsetY: 0,
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Slider
              value={[background.offsetY ?? 0]}
              max={200}
              min={-200}
              step={1}
              className="mt-2"
              onValueChange={(value) =>
                onBackgroundUpdate?.({
                  ...background,
                  offsetY: value[0],
                })
              }
            />
            {/* Plug-and-play property controls */}
            {propertyControlsConfig.background.map((ctrl) => (
              <PropertyControl
                key={ctrl.key}
                label={ctrl.label}
                value={background[ctrl.key] ?? ctrl.default}
                min={ctrl.min}
                max={ctrl.max}
                step={ctrl.step}
                defaultValue={ctrl.default}
                icon={ctrl.icon}
                onChange={(val) =>
                  onBackgroundUpdate?.({
                    ...background,
                    [ctrl.key]: val,
                  })
                }
                onReset={() =>
                  onBackgroundUpdate?.({
                    ...background,
                    [ctrl.key]: ctrl.default,
                  })
                }
              />
            ))}
            {/* Filter Picker */}
            <div>
              <Label className="text-xs">Filter</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                <MediaSkin
                  src={background.value}
                  type="image"
                  selectedFilter={background.filter}
                  onSelect={(filter) =>
                    onBackgroundUpdate?.({
                      ...background,
                      filter,
                    })
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

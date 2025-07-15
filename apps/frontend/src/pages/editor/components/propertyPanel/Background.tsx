import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import BackgroundColorGradientPicker from '../ColorPicker'
import MediaSourcePicker from '../MediaSourcePicker'
import MediaSkin from '../MediaSkin'
import { Button } from '@/components/ui/button'
import PropertyControl from './PropertyControl'
import { propertyControlsConfig } from './propertyControlsConfig'

export default function PropertyPanelBackground({
  background,
  onBackgroundUpdate,
}: any) {
  if (!background) return null
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Background Properties</h3>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Background Type</Label>
          <Select
            value={background.type}
            onValueChange={(value) =>
              onBackgroundUpdate?.({
                type: value as 'color' | 'image' | 'video',
                value: '', // Reset value, user will pick new
              })
            }
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
        {background.type === 'color' && (
          <div>
            <BackgroundColorGradientPicker
              value={background.value}
              onSelect={(val) =>
                onBackgroundUpdate?.({
                  type: 'color',
                  value: val,
                })
              }
            />
          </div>
        )}
        {background.type === 'image' && (
          <>
            <div>
              <MediaSourcePicker
                type="image"
                value={background.value}
                onChange={(url) =>
                  onBackgroundUpdate?.({
                    ...background,
                    value: url,
                  })
                }
              />
            </div>
            {/* Pan Controls */}
            <div className="flex items-center gap-2">
              <Label className="text-xs">Pan X</Label>
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
                <span className="text-xs">0</span>
              </Button>
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
                <span className="text-xs">0</span>
              </Button>
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

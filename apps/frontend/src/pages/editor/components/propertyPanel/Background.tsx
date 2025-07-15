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
import { RotateCcw, ZoomIn, Droplet } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
            <div className="flex items-center gap-2">
              <Label className="text-xs">Opacity</Label>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Reset Opacity"
                onClick={() =>
                  onBackgroundUpdate?.({
                    ...background,
                    opacity: 100,
                  })
                }
              >
                <Droplet className="h-4 w-4" />
              </Button>
            </div>
            <Slider
              value={[background.opacity ?? 100]}
              max={100}
              min={0}
              step={1}
              className="mt-2"
              onValueChange={(value) =>
                onBackgroundUpdate?.({
                  ...background,
                  opacity: value[0],
                })
              }
            />
            <div className="flex items-center gap-2">
              <Label className="text-xs">Rotation</Label>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Reset Rotation"
                onClick={() =>
                  onBackgroundUpdate?.({
                    ...background,
                    rotation: 0,
                  })
                }
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
            <Slider
              value={[background.rotation ?? 0]}
              max={360}
              min={-360}
              step={1}
              className="mt-2"
              onValueChange={(value) =>
                onBackgroundUpdate?.({
                  ...background,
                  rotation: value[0],
                })
              }
            />
            <div className="flex items-center gap-2">
              <Label className="text-xs">Zoom</Label>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 p-0"
                title="Reset Zoom"
                onClick={() =>
                  onBackgroundUpdate?.({
                    ...background,
                    zoom: 100,
                  })
                }
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Slider
              value={[background.zoom ?? 100]}
              max={300}
              min={10}
              step={1}
              className="mt-2"
              onValueChange={(value) =>
                onBackgroundUpdate?.({
                  ...background,
                  zoom: value[0],
                })
              }
            />
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

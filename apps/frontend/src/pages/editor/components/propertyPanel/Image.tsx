import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Image } from 'lucide-react'

export default function PropertyPanelImage({
  element,
  onElementUpdate,
  background,
  onBackgroundUpdate,
  onElementRemove,
}: any) {
  if (!element) return null
  return (
    <div className="space-y-4">
      <h3 className="flex items-center text-sm font-semibold">
        <Image className="mr-2 h-4 w-4" />
        Image Properties
      </h3>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Opacity</Label>
          <Slider
            value={[element.style?.opacity || 100]}
            max={100}
            min={0}
            step={1}
            className="mt-2"
            onValueChange={(value) =>
              onElementUpdate?.(element.id, {
                style: { opacity: value[0] },
              })
            }
          />
        </div>
        <div>
          <Label className="text-xs">Rotation</Label>
          <Slider
            value={[element.style?.rotation || 0]}
            max={360}
            min={-360}
            step={1}
            className="mt-2"
            onValueChange={(value) =>
              onElementUpdate?.(element.id, {
                style: { rotation: value[0] },
              })
            }
          />
        </div>
        {/* Set as Background Button */}
        <div>
          <Button
            variant={
              background?.type === 'image' &&
              background?.value === element.mediaUrl
                ? 'default'
                : 'outline'
            }
            className="w-full"
            disabled={
              background?.type === 'image' &&
              background?.value === element.mediaUrl
            }
            onClick={() => {
              if (element.mediaUrl) {
                onBackgroundUpdate?.({
                  type: 'image',
                  value: element.mediaUrl,
                })
                onElementRemove?.(element.id)
              }
            }}
          >
            {background?.type === 'image' &&
            background?.value === element.mediaUrl
              ? 'Is Background'
              : 'Set as Background'}
          </Button>
        </div>
      </div>
    </div>
  )
}

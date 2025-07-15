import { Button } from '@/components/ui/button'
import { Image } from 'lucide-react'
import PropertyControl from './PropertyControl'
import { propertyControlsConfig } from './propertyControlsConfig'

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
        {/* Plug-and-play property controls */}
        {propertyControlsConfig.image.map((ctrl) => (
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

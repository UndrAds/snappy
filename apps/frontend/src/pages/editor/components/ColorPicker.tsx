import { BACKGROUND_COLORS, BACKGROUND_GRADIENTS } from '@/lib/colors'

export default function BackgroundColorGradientPicker({
  value,
  onSelect,
}: {
  value: string
  onSelect: (val: string) => void
}) {
  return (
    <div className="space-y-2">
      <div>
        <div className="mb-1 text-xs font-semibold text-muted-foreground">
          Colors
        </div>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_COLORS.map((color) => (
            <div
              key={color.value}
              className={`h-8 w-8 cursor-pointer rounded border ${color.bgClass} transition-transform hover:scale-110 ${value === color.value ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}
              onClick={() => onSelect(color.value)}
              title={color.name}
            />
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1 mt-2 text-xs font-semibold text-muted-foreground">
          Gradients
        </div>
        <div className="flex flex-wrap gap-2">
          {BACKGROUND_GRADIENTS.map((gradient) => (
            <div
              key={gradient.value}
              className={`h-8 w-16 cursor-pointer rounded border ${gradient.bgClass} transition-transform hover:scale-110 ${value === gradient.value ? 'border-primary ring-2 ring-primary/50' : 'border-border'}`}
              onClick={() => onSelect(gradient.value)}
              title={gradient.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import React from 'react'

interface PropertyControlProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  defaultValue: number
  icon?: React.ComponentType<{ className?: string }>
  onChange: (value: number) => void
  onReset?: () => void
  className?: string
}

export default function PropertyControl({
  label,
  value,
  min,
  max,
  step = 1,
  icon: Icon,
  onChange,
  onReset,
  className = '',
}: PropertyControlProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <Label className="text-xs">{label}</Label>
        {onReset && (
          <Button
            size="icon"
            variant="ghost"
            className="ml-auto h-6 w-6 p-0"
            title={`Reset ${label}`}
            onClick={onReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Slider
        value={[value]}
        max={max}
        min={min}
        step={step}
        className="mt-2"
        onValueChange={(val) => onChange(val[0])}
      />
    </div>
  )
}

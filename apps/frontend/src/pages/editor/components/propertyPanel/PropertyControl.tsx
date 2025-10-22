import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RotateCcw } from 'lucide-react'
import React, { useState, useEffect } from 'react'

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
  const [inputValue, setInputValue] = useState(value.toString())

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString())
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Only update if it's a valid number within bounds
    const numValue = parseFloat(newValue)
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue)
    }
  }

  const handleInputBlur = () => {
    // On blur, ensure the value is within bounds
    const numValue = parseFloat(inputValue)
    if (isNaN(numValue) || numValue < min || numValue > max) {
      setInputValue(value.toString())
    }
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <Label className="text-xs">{label}</Label>
        <div className="ml-auto flex items-center gap-2">
          <Input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className="h-6 w-16 text-xs"
          />
          {onReset && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 p-0"
              title={`Reset ${label}`}
              onClick={onReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
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

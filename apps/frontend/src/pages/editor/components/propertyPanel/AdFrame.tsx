import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Megaphone } from 'lucide-react'

interface AdFrameProps {
  element: {
    id: string
    type: 'ad'
    durationMs?: number
    adConfig?: {
      adId: string
      adUnitPath?: string
      size?: [number, number]
    }
  }
  onElementUpdate: (elementId: string, updates: any) => void
  onFrameUpdate: (frameId: string, updates: any) => void
}

// Default test ad code
const DEFAULT_AD_CODE = '/6355419/Travel/Europe/France/Paris'

export default function PropertyPanelAdFrame({
  element,
  onFrameUpdate,
}: AdFrameProps) {
  const [adCode, setAdCode] = useState(
    element.adConfig?.adUnitPath || DEFAULT_AD_CODE
  )
  const [durationMode, setDurationMode] = useState<string>(() => {
    const ms = element.durationMs ?? 2500
    const preset = [5000, 10000, 15000, 20000, 30000].includes(ms)
      ? String(ms)
      : 'custom'
    return preset
  })
  const [customDurationSec, setCustomDurationSec] = useState<string>(() => {
    const ms = element.durationMs ?? 2500
    return [5000, 10000, 15000, 20000, 30000].includes(ms)
      ? '5'
      : String(Math.round(ms / 1000))
  })
  const isCustomInvalid =
    durationMode === 'custom' &&
    (isNaN(Number(customDurationSec)) || Number(customDurationSec) < 1)

  const handleAdCodeChange = (value: string) => {
    setAdCode(value)
    onFrameUpdate(element.id, {
      adConfig: {
        adId: value,
        adUnitPath: value,
        size: [300, 250], // Default size for Google Ads
      },
    })
  }

  const handleDurationSave = () => {
    const durationMs =
      durationMode === 'custom'
        ? Math.max(1, Number(customDurationSec) || 5) * 1000
        : Number(durationMode)
    onFrameUpdate(element.id, { durationMs })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        <h3 className="text-lg font-semibold">Ad Frame Properties</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ad-code">Ad Unit Code</Label>
          <Input
            id="ad-code"
            placeholder="Enter your Google Ad Manager ad unit code"
            value={adCode}
            onChange={(e) => handleAdCodeChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter your Google Ad Manager ad unit path (e.g.,
            /6355419/Travel/Europe/France/Paris)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Ad Details</Label>
          <div className="space-y-2 rounded-lg border bg-muted p-3">
            <div className="text-sm">
              <span className="font-medium">Ad Unit:</span>{' '}
              <code className="rounded border bg-background px-2 py-1 text-xs">
                {adCode}
              </code>
            </div>
            <div className="text-sm">
              <span className="font-medium">Size:</span> 300x250px (Default)
            </div>
            <div className="text-sm">
              <span className="font-medium">Type:</span> Google Ad Manager
              Display Ad
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex items-center justify-center rounded-lg border bg-black p-4 dark:bg-gray-900">
            <div className="text-center text-white">
              <Megaphone className="mx-auto mb-2 h-8 w-8 text-orange-400" />
              <div className="text-sm">Ad Frame</div>
              <div className="text-xs text-gray-400">Google Ad Manager</div>
            </div>
          </div>
        </div>

        {/* Frame Duration */}
        <div className="space-y-2">
          <Label>Frame Duration</Label>
          <div className="flex flex-wrap gap-2">
            {[5000, 10000, 15000, 20000, 30000].map((ms) => (
              <button
                key={ms}
                type="button"
                className={`rounded border px-3 py-1 text-sm ${
                  durationMode === String(ms)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background'
                }`}
                onClick={() => setDurationMode(String(ms))}
              >
                {ms / 1000}s
              </button>
            ))}
            <button
              type="button"
              className={`rounded border px-3 py-1 text-sm ${
                durationMode === 'custom'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background'
              }`}
              onClick={() => setDurationMode('custom')}
            >
              Custom
            </button>
          </div>
          {durationMode === 'custom' && (
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min={1}
                value={customDurationSec}
                onChange={(e) => setCustomDurationSec(e.target.value)}
                onBlur={() => {
                  const n = Math.max(1, Number(customDurationSec) || 1)
                  setCustomDurationSec(String(Math.round(n)))
                }}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">seconds</span>
            </div>
          )}
          {isCustomInvalid && (
            <p className="text-xs text-red-600">Minimum is 1 second.</p>
          )}
          <div>
            <button
              type="button"
              className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground"
              onClick={handleDurationSave}
              disabled={isCustomInvalid}
            >
              Save Duration
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

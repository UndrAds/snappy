import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

interface FramePropertyPanelProps {
  element: {
    id: string
    name?: string
    displayName?: string
    link?: string
    linkText?: string
    frameType: 'story' | 'ad'
    order?: number
    durationMs?: number
  }
  storyDefaultDurationMs?: number
  onFrameUpdate: (
    frameId: string,
    updates: {
      name?: string
      link?: string
      linkText?: string
      durationMs?: number
    }
  ) => void
}

export default function FramePropertyPanel({
  element,
  onFrameUpdate,
  storyDefaultDurationMs,
}: FramePropertyPanelProps) {
  const [name, setName] = useState(
    (element.name ?? element.displayName ?? '') as string
  )
  const [link, setLink] = useState(element.link || '')
  const [linkText, setLinkText] = useState(element.linkText || '')
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

  // Sync state when element changes (e.g., when switching between frames)
  useEffect(() => {
    console.log('FramePropertyPanel useEffect triggered:', {
      elementId: element.id,
      elementName: element.name,
      elementLink: element.link,
      elementLinkText: element.linkText,
      fullElement: element,
    })
    setName((element.name ?? element.displayName ?? '') as string)
    setLink(element.link ?? '')
    setLinkText(element.linkText ?? '')
    const ms = element.durationMs ?? 2500
    const preset = [5000, 10000, 15000, 20000, 30000].includes(ms)
      ? String(ms)
      : 'custom'
    setDurationMode(preset)
    setCustomDurationSec(
      [5000, 10000, 15000, 20000, 30000].includes(ms)
        ? '5'
        : String(Math.round(ms / 1000))
    )
  }, [
    element.id,
    element.name,
    element.link,
    element.linkText,
    element.durationMs,
  ])

  const handleSave = () => {
    const durationMs =
      durationMode === 'custom'
        ? Math.max(1, Number(customDurationSec) || 5) * 1000
        : Number(durationMode)
    onFrameUpdate(element.id, { name, link, linkText, durationMs })
    toast.success('Frame properties updated!')
  }

  const handleTestLink = () => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Frame Properties</h3>
        <p className="text-sm text-muted-foreground">
          Configure frame name and link settings
        </p>
      </div>

      {/* Frame Name */}
      <div className="space-y-2">
        <Label htmlFor="frame-name">Frame Name</Label>
        <Input
          id="frame-name"
          placeholder="Enter frame name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Give this frame a custom name for easier identification
        </p>
      </div>

      {/* Frame Link */}
      <div className="space-y-2">
        <Label htmlFor="frame-link">Frame Link</Label>
        <div className="flex space-x-2">
          <Input
            id="frame-link"
            placeholder="https://example.com"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="flex-1"
          />
          {link && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestLink}
              disabled={!isValidUrl(link)}
              title="Test link"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Add a link that users can click when viewing this frame
        </p>
      </div>

      {/* Frame Link Text */}
      <div className="space-y-2">
        <Label htmlFor="frame-link-text">Link Text</Label>
        <Input
          id="frame-link-text"
          placeholder="Read More"
          value={linkText}
          onChange={(e) => setLinkText(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Custom text to display on the link indicator (defaults to "Read More")
        </p>
      </div>

      {link && !isValidUrl(link) && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Please enter a valid URL (e.g., https://example.com)
        </p>
      )}

      {/* Frame Type Display */}
      <div className="space-y-2">
        <Label>Frame Type</Label>
        <div className="flex items-center space-x-2">
          <div
            className={`rounded px-2 py-1 text-xs font-medium ${
              element.frameType === 'story'
                ? 'bg-primary/10 text-primary'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}
          >
            {element.frameType === 'story' ? 'Story Frame' : 'Ad Frame'}
          </div>
        </div>
      </div>

      {/* Frame Duration */}
      <div className="space-y-2">
        <Label htmlFor="frame-duration">Frame Duration</Label>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Story default: {Math.round((storyDefaultDurationMs ?? 2500) / 1000)}
            s
          </div>
          <div className="flex flex-wrap gap-2">
            {[5000, 10000, 15000, 20000, 30000].map((ms) => (
              <Button
                key={ms}
                type="button"
                variant={durationMode === String(ms) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDurationMode(String(ms))}
              >
                {ms / 1000}s
              </Button>
            ))}
            <Button
              type="button"
              variant={durationMode === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDurationMode('custom')}
            >
              Custom
            </Button>
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
          <p className="text-xs text-muted-foreground">
            Default is based on current embed timing. Applies to this frame
            only.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        className="w-full"
        disabled={isCustomInvalid}
      >
        <Link className="mr-2 h-4 w-4" />
        Save Frame Properties
      </Button>

      {/* Link Preview */}
      {link && isValidUrl(link) && (
        <div className="space-y-2">
          <Label>Link Preview</Label>
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-primary" />
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-primary hover:text-primary/80"
              >
                {link}
              </a>
            </div>
            <div className="mt-2 text-xs text-primary">
              ✓ This frame will be clickable when published
            </div>
          </div>
        </div>
      )}

      {/* Link Status */}
      {link && !isValidUrl(link) && (
        <div className="space-y-2">
          <Label>Link Status</Label>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-red-600 dark:text-red-400">
                Invalid URL format
              </span>
            </div>
            <div className="mt-2 text-xs text-red-600 dark:text-red-400">
              ⚠️ Please enter a valid URL (e.g., https://example.com)
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

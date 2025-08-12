import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy } from 'lucide-react'
import React from 'react'

const SIZE_PRESETS = {
  large: { width: 400, height: 700 },
  medium: { width: 300, height: 525 },
  small: { width: 200, height: 350 },
}

interface EmbedModalProps {
  open: boolean
  onClose: () => void
  storyId: string
  storyData: Record<string, unknown>
}

const EmbedModal: React.FC<EmbedModalProps> = ({ open, onClose, storyId }) => {
  const [autoplay, setAutoplay] = useState(false)
  const [size, setSize] = useState<'large' | 'medium' | 'small' | 'custom'>(
    'medium'
  )
  const [customWidth, setCustomWidth] = useState(300)
  const [customHeight, setCustomHeight] = useState(525)

  const { width, height } =
    size === 'custom'
      ? { width: customWidth, height: customHeight }
      : SIZE_PRESETS[size]

  // Use public path for the script
  const scriptSrc = '/webstory-embed.js'
  // Get API URL from environment or use default
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
  // Generate embed code with story ID and API URL
  const embedCode = `<div id="snappy-webstory-${storyId}" style="width:${width}px;height:${height}px;"></div>\n<script src="${scriptSrc}" data-story-id="${storyId}" data-api-url="${apiUrl}" data-autoplay="${autoplay}"></script>`

  const handleCopy = () => {
    void navigator.clipboard.writeText(embedCode)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Embed Web Story</DialogTitle>
        </DialogHeader>
        <div className="mb-2 text-xs text-gray-500">
          Paste this code into your website where you want the story to appear.
          <br />
          The story data will be automatically fetched from our servers.
        </div>
        <div className="space-y-4">
          <div>
            <label className="font-medium">Autoplay</label>
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(e) => setAutoplay(e.target.checked)}
              className="ml-2"
            />
          </div>
          <div>
            <label className="font-medium">Size</label>
            <select
              value={size}
              onChange={(e) =>
                setSize(
                  e.target.value as 'large' | 'medium' | 'small' | 'custom'
                )
              }
              className="ml-2"
            >
              <option value="large">Large</option>
              <option value="medium">Medium</option>
              <option value="small">Small</option>
              <option value="custom">Custom</option>
            </select>
            {size === 'custom' && (
              <div className="mt-2 flex gap-2">
                <Input
                  type="number"
                  min={100}
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  placeholder="Width (px)"
                />
                <Input
                  type="number"
                  min={100}
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  placeholder="Height (px)"
                />
              </div>
            )}
          </div>
          <div>
            <label className="font-medium">Embed Code</label>
            <div className="relative mt-1">
              <textarea
                className="w-full rounded border bg-gray-100 p-2 font-mono text-xs"
                rows={4}
                value={embedCode}
                readOnly
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-2"
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EmbedModal

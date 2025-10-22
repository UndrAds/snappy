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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Copy } from 'lucide-react'
import React from 'react'
import { toast } from 'sonner'
import type {
  StoryFormat,
  DeviceFrame,
  FloaterDirection,
} from '@snappy/shared-types'

interface EmbedModalProps {
  open: boolean
  onClose: () => void
  storyId: string
  storyData: {
    story: {
      storyTitle: string
      publisherName: string
      publisherPic?: string
      thumbnail?: string
      background?: string
      ctaType: 'redirect' | 'form' | 'promo' | 'sell' | null
      ctaValue: string
      format?: StoryFormat
      deviceFrame?: DeviceFrame
    }
    frames: any[]
  }
}

const EmbedModal: React.FC<EmbedModalProps> = ({
  open,
  onClose,
  storyId,
  storyData,
}) => {
  const [embedType, setEmbedType] = useState<'regular' | 'floater'>('regular')
  const [autoplay, setAutoplay] = useState(false)
  const [size, setSize] = useState<'large' | 'medium' | 'small' | 'custom'>(
    'medium'
  )
  const [customWidth, setCustomWidth] = useState(300)
  const [customHeight, setCustomHeight] = useState(525)

  // Floater specific options
  const [direction, setDirection] = useState<FloaterDirection>('right')
  const [triggerScroll, setTriggerScroll] = useState(50)
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom')
  const [floaterSize, setFloaterSize] = useState<'small' | 'medium' | 'large'>(
    'medium'
  )
  const [showCloseButton, setShowCloseButton] = useState(true)
  const [autoHide, setAutoHide] = useState(false)
  const [autoHideDelay, setAutoHideDelay] = useState(5000)

  // Get format and device frame from story data
  const format = storyData?.story?.format || 'portrait'
  const deviceFrame = storyData?.story?.deviceFrame || 'mobile'

  // Dynamic size presets based on format and device frame
  const getSizePresets = () => {
    if (format === 'portrait') {
      if (deviceFrame === 'mobile') {
        return {
          large: { width: 400, height: 700 },
          medium: { width: 300, height: 525 },
          small: { width: 200, height: 350 },
        }
      } else {
        // Video player portrait
        return {
          large: { width: 480, height: 720 },
          medium: { width: 360, height: 540 },
          small: { width: 240, height: 360 },
        }
      }
    } else {
      // Landscape format
      if (deviceFrame === 'mobile') {
        return {
          large: { width: 600, height: 338 },
          medium: { width: 450, height: 253 },
          small: { width: 300, height: 169 },
        }
      } else {
        // Video player landscape
        return {
          large: { width: 720, height: 405 },
          medium: { width: 540, height: 304 },
          small: { width: 360, height: 203 },
        }
      }
    }
  }

  const SIZE_PRESETS = getSizePresets()

  const { width, height } =
    size === 'custom'
      ? { width: customWidth, height: customHeight }
      : SIZE_PRESETS[size]

  // Get the base URL for external embedding
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  // Use absolute URL for embed script (needed for external websites)
  const scriptSrc = `${baseUrl}/webstory-embed.js`
  // For external embedding, use the full API URL (not relative)
  const apiUrl = import.meta.env.VITE_API_URL || baseUrl

  // Generate embed code based on type
  const generateEmbedCode = () => {
    if (embedType === 'floater') {
      return `<script src="${scriptSrc}" 
  data-story-id="${storyId}" 
  data-api-url="${apiUrl}" 
  data-floater="true"
  data-direction="${direction}"
  data-trigger-scroll="${triggerScroll}"
  data-position="${position}"
  data-size="${floaterSize}"
  data-show-close="${showCloseButton}"
  data-auto-hide="${autoHide}"
  data-auto-hide-delay="${autoHideDelay}"></script>`
    } else {
      return `<div id="snappy-webstory-${storyId}" style="width:${width}px;height:${height}px;"></div>\n<script src="${scriptSrc}" data-story-id="${storyId}" data-api-url="${apiUrl}" data-autoplay="${autoplay}"></script>`
    }
  }

  const embedCode = generateEmbedCode()

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode)
      toast.success('Embed code copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed Web Story</DialogTitle>
        </DialogHeader>
        <div className="mb-2 text-xs text-muted-foreground">
          Paste this code into your website where you want the story to appear.
          <br />
          The story data will be automatically fetched from our servers.
          <br />
          <span className="font-medium">
            Format: {format} | Device: {deviceFrame}
          </span>
        </div>
        <div className="space-y-4">
          {/* Embed Type Selection */}
          <div>
            <Label className="font-medium">Embed Type</Label>
            <Select
              value={embedType}
              onValueChange={(value: 'regular' | 'floater') =>
                setEmbedType(value)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Embed</SelectItem>
                <SelectItem value="floater">
                  Floater (Scroll-triggered)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {embedType === 'regular' ? (
            // Regular embed options
            <>
              <div>
                <Label className="font-medium">Autoplay</Label>
                <div className="mt-1 flex items-center space-x-2">
                  <Switch checked={autoplay} onCheckedChange={setAutoplay} />
                  <span className="text-sm">Automatically play the story</span>
                </div>
              </div>
              <div>
                <Label className="font-medium">Size</Label>
                <Select
                  value={size}
                  onValueChange={(
                    value: 'large' | 'medium' | 'small' | 'custom'
                  ) => setSize(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="large">
                      Large ({SIZE_PRESETS.large.width}×
                      {SIZE_PRESETS.large.height})
                    </SelectItem>
                    <SelectItem value="medium">
                      Medium ({SIZE_PRESETS.medium.width}×
                      {SIZE_PRESETS.medium.height})
                    </SelectItem>
                    <SelectItem value="small">
                      Small ({SIZE_PRESETS.small.width}×
                      {SIZE_PRESETS.small.height})
                    </SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
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
            </>
          ) : (
            // Floater embed options
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Direction</Label>
                  <Select
                    value={direction}
                    onValueChange={(value: FloaterDirection) =>
                      setDirection(value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="font-medium">Position</Label>
                  <Select
                    value={position}
                    onValueChange={(value: 'bottom' | 'top') =>
                      setPosition(value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom">Bottom</SelectItem>
                      <SelectItem value="top">Top</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="font-medium">Trigger Scroll (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={triggerScroll}
                  onChange={(e) => setTriggerScroll(Number(e.target.value))}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The floater will appear when user scrolls this percentage of
                  the page
                </p>
              </div>

              <div>
                <Label className="font-medium">Floater Size</Label>
                <Select
                  value={floaterSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') =>
                    setFloaterSize(value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (200×350)</SelectItem>
                    <SelectItem value="medium">Medium (280×490)</SelectItem>
                    <SelectItem value="large">Large (360×630)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Show Close Button</Label>
                  <Switch
                    checked={showCloseButton}
                    onCheckedChange={setShowCloseButton}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Auto Hide</Label>
                  <Switch checked={autoHide} onCheckedChange={setAutoHide} />
                </div>
                {autoHide && (
                  <div>
                    <Label className="font-medium">Auto Hide Delay (ms)</Label>
                    <Input
                      type="number"
                      min={1000}
                      value={autoHideDelay}
                      onChange={(e) => setAutoHideDelay(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div>
            <Label className="font-medium">Embed Code</Label>
            <div className="relative mt-1">
              <textarea
                className="w-full rounded border bg-muted p-2 font-mono text-xs"
                rows={embedType === 'floater' ? 8 : 4}
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

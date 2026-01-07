import { useEffect, useRef, useState } from 'react'
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
import { storyAPI } from '@/lib/api'

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
  const [loop, setLoop] = useState(false)
  const [size, setSize] = useState<'large' | 'medium' | 'small' | 'custom'>(
    'medium'
  )
  const [customWidth, setCustomWidth] = useState(300)
  const [customHeight, setCustomHeight] = useState(525)

  // Floater specific options
  const [direction, setDirection] = useState<FloaterDirection>('right')
  const [triggerScroll, setTriggerScroll] = useState(50)
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom')
  const [floaterSize, setFloaterSize] = useState<
    'small' | 'medium' | 'large' | 'custom'
  >('medium')
  const [floaterCustomWidth, setFloaterCustomWidth] = useState(280)
  const [floaterCustomHeight, setFloaterCustomHeight] = useState(490)
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

  // Get width and height based on size selection
  const { width, height } =
    size === 'custom'
      ? { width: customWidth, height: customHeight }
      : SIZE_PRESETS[size]

  // Get the base URL for external embedding
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin
  // Use absolute URL for embed script (needed for external websites)
  const scriptSrc = `${baseUrl}/webstory-embed.js`

  // Resolve the actual story ID (in case we receive a uniqueId)
  const [resolvedStoryId, setResolvedStoryId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function resolveId() {
      if (!open || !storyId) return
      try {
        // Try public fetch by uniqueId; if it works, use the returned id
        const res = await storyAPI.getStoryByUniqueId(storyId)
        if (!cancelled && res?.success && res.data?.id) {
          setResolvedStoryId(res.data.id)
          return
        }
      } catch (_) {
        // ignore
      }
      // Fall back to given storyId as an id
      if (!cancelled) setResolvedStoryId(storyId)
    }
    resolveId()
    return () => {
      cancelled = true
    }
  }, [open, storyId])

  // Persist settings to backend (debounced)
  const saveTimeout = useRef<number | null>(null)
  const scheduleSave = () => {
    if (saveTimeout.current) {
      window.clearTimeout(saveTimeout.current)
      saveTimeout.current = null
    }
    saveTimeout.current = window.setTimeout(async () => {
      try {
        const embedConfig: any = {
          type: embedType,
          regular: {
            autoplay,
            loop,
            width,
            height,
          },
          floater: {
            enabled: embedType === 'floater',
            direction,
            triggerScroll,
            position,
            size: floaterSize,
            ...(floaterSize === 'custom'
              ? {
                  customWidth: floaterCustomWidth,
                  customHeight: floaterCustomHeight,
                }
              : {}),
            showCloseButton,
            autoHide,
            autoHideDelay,
            autoplay,
            loop,
          },
        }
        const idToUse = resolvedStoryId || storyId
        await storyAPI.updateStory(idToUse, { embedConfig } as any)
      } catch (e) {
        console.error('Failed to save embed settings', e)
      }
    }, 400)
  }

  // Track previous format to detect orientation changes
  const prevFormatRef = useRef<string | null>(null)

  // Initialize from existing embedConfig if provided
  useEffect(() => {
    const currentFormat = format
    const prevFormat = prevFormatRef.current

    // If format changed (portrait <-> landscape), reset size to medium for new format
    if (prevFormat !== null && prevFormat !== currentFormat) {
      setSize('medium')
      const presets = getSizePresets()
      setCustomWidth(presets.medium.width)
      setCustomHeight(presets.medium.height)
    }
    prevFormatRef.current = currentFormat

    const cfg = (storyData as any)?.story?.embedConfig || ({} as any)
    if (cfg.type) setEmbedType(cfg.type)
    if (cfg.regular) {
      if (typeof cfg.regular.autoplay === 'boolean')
        setAutoplay(cfg.regular.autoplay)
      if (typeof cfg.regular.loop === 'boolean') setLoop(cfg.regular.loop)
      if (typeof cfg.regular.width === 'number')
        setCustomWidth(cfg.regular.width)
      if (typeof cfg.regular.height === 'number')
        setCustomHeight(cfg.regular.height)
      // Derive size from saved width/height
      const w = cfg.regular.width
      const h = cfg.regular.height
      if (typeof w === 'number' && typeof h === 'number') {
        const presets = getSizePresets()
        const near = (a: number, b: number) => Math.abs(a - b) <= 2
        // Check if saved size orientation matches current format; if not, reset to medium
        const isLandscapeSize = w > h
        const expectLandscape = currentFormat === 'landscape'
        if (isLandscapeSize !== expectLandscape) {
          // Orientation mismatch - reset to medium for current format
          setSize('medium')
          setCustomWidth(presets.medium.width)
          setCustomHeight(presets.medium.height)
        } else {
          // Orientation matches - check if it matches a preset
          if (near(w, presets.large.width) && near(h, presets.large.height))
            setSize('large')
          else if (
            near(w, presets.medium.width) &&
            near(h, presets.medium.height)
          )
            setSize('medium')
          else if (
            near(w, presets.small.width) &&
            near(h, presets.small.height)
          )
            setSize('small')
          else setSize('custom')
        }
      }
    }
    if (cfg.floater) {
      if (typeof cfg.floater.direction === 'string')
        setDirection(cfg.floater.direction)
      if (typeof cfg.floater.triggerScroll === 'number')
        setTriggerScroll(cfg.floater.triggerScroll)
      if (typeof cfg.floater.position === 'string')
        setPosition(cfg.floater.position)
      if (typeof cfg.floater.size === 'string') setFloaterSize(cfg.floater.size)
      if (
        typeof (cfg.floater as any).customWidth === 'number' &&
        typeof (cfg.floater as any).customHeight === 'number'
      ) {
        setFloaterSize('custom')
        setFloaterCustomWidth((cfg.floater as any).customWidth)
        setFloaterCustomHeight((cfg.floater as any).customHeight)
      }
      if (typeof cfg.floater.showCloseButton === 'boolean')
        setShowCloseButton(cfg.floater.showCloseButton)
      if (typeof cfg.floater.autoHide === 'boolean')
        setAutoHide(cfg.floater.autoHide)
      if (typeof cfg.floater.autoHideDelay === 'number')
        setAutoHideDelay(cfg.floater.autoHideDelay)
      if (typeof cfg.floater.autoplay === 'boolean')
        setAutoplay(cfg.floater.autoplay)
      if (typeof cfg.floater.loop === 'boolean') setLoop(cfg.floater.loop)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyId, format])

  // If no embedConfig present in provided storyData, fetch fresh story to hydrate settings
  useEffect(() => {
    const cfg = (storyData as any)?.story?.embedConfig
    if (open && !cfg && storyId) {
      ;(async () => {
        try {
          // Prefer public uniqueId route first (works in preview and embed contexts)
          const res = await storyAPI.getStoryByUniqueId(storyId)
          if (res?.success && res.data && (res.data as any).embedConfig) {
            const ec: any = (res.data as any).embedConfig
            if (ec.type) setEmbedType(ec.type)
            if (ec.regular) {
              if (typeof ec.regular.autoplay === 'boolean')
                setAutoplay(ec.regular.autoplay)
              if (typeof ec.regular.loop === 'boolean') setLoop(ec.regular.loop)
              if (typeof ec.regular.width === 'number')
                setCustomWidth(ec.regular.width)
              if (typeof ec.regular.height === 'number')
                setCustomHeight(ec.regular.height)
              // Derive size from saved width/height
              const w = ec.regular.width
              const h = ec.regular.height
              if (typeof w === 'number' && typeof h === 'number') {
                const presets = getSizePresets()
                const near = (a: number, b: number) => Math.abs(a - b) <= 2
                // Check if saved size orientation matches current format; if not, reset to medium
                const isLandscapeSize = w > h
                const expectLandscape = format === 'landscape'
                if (isLandscapeSize !== expectLandscape) {
                  // Orientation mismatch - reset to medium for current format
                  setSize('medium')
                  setCustomWidth(presets.medium.width)
                  setCustomHeight(presets.medium.height)
                } else {
                  // Orientation matches - check if it matches a preset
                  if (
                    near(w, presets.large.width) &&
                    near(h, presets.large.height)
                  )
                    setSize('large')
                  else if (
                    near(w, presets.medium.width) &&
                    near(h, presets.medium.height)
                  )
                    setSize('medium')
                  else if (
                    near(w, presets.small.width) &&
                    near(h, presets.small.height)
                  )
                    setSize('small')
                  else setSize('custom')
                }
              }
            }
            if (ec.floater) {
              if (typeof ec.floater.direction === 'string')
                setDirection(ec.floater.direction)
              if (typeof ec.floater.triggerScroll === 'number')
                setTriggerScroll(ec.floater.triggerScroll)
              if (typeof ec.floater.position === 'string')
                setPosition(ec.floater.position)
              if (typeof ec.floater.size === 'string')
                setFloaterSize(ec.floater.size)
              if (
                typeof (ec.floater as any).customWidth === 'number' &&
                typeof (ec.floater as any).customHeight === 'number'
              ) {
                setFloaterSize('custom')
                setFloaterCustomWidth((ec.floater as any).customWidth)
                setFloaterCustomHeight((ec.floater as any).customHeight)
              }
              if (typeof ec.floater.showCloseButton === 'boolean')
                setShowCloseButton(ec.floater.showCloseButton)
              if (typeof ec.floater.autoHide === 'boolean')
                setAutoHide(ec.floater.autoHide)
              if (typeof ec.floater.autoHideDelay === 'number')
                setAutoHideDelay(ec.floater.autoHideDelay)
              if (typeof ec.floater.autoplay === 'boolean')
                setAutoplay(ec.floater.autoplay)
              if (typeof ec.floater.loop === 'boolean') setLoop(ec.floater.loop)
            }
          }
        } catch (e) {
          // Silent: modal still works with defaults
        }
      })()
    }
  }, [open, storyId, storyData, format])

  // Auto-save on changes
  useEffect(() => {
    scheduleSave()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    embedType,
    autoplay,
    loop,
    size,
    customWidth,
    customHeight,
    direction,
    triggerScroll,
    position,
    floaterSize,
    showCloseButton,
    autoHide,
    autoHideDelay,
  ])

  // Generate minimal embed code (settings controlled by app)
  const generateEmbedCode = () => {
    return {
      head: `<script src="${scriptSrc}"></script>`,
      body: `<ins id="snappy-webstory-${storyId}" \n  data-story-id="${storyId}" \n  data-api-url="${baseUrl}"></ins>`,
    }
  }

  const embedCode = generateEmbedCode()

  const handleCopy = async (type: 'head' | 'body' | 'all') => {
    try {
      let textToCopy = ''
      if (type === 'head') {
        textToCopy = embedCode.head
      } else if (type === 'body') {
        textToCopy = embedCode.body
      } else {
        textToCopy = `<!-- Add this to your <head> section -->\n${embedCode.head}\n\n<!-- Add this to your <body> section -->\n${embedCode.body}`
      }

      await navigator.clipboard.writeText(textToCopy)
      toast.success(
        `${type === 'all' ? 'Full' : type.charAt(0).toUpperCase() + type.slice(1)} embed code copied to clipboard!`
      )
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
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
                <Label className="font-medium">Loop</Label>
                <div className="mt-1 flex items-center space-x-2">
                  <Switch checked={loop} onCheckedChange={setLoop} />
                  <span className="text-sm">
                    Loop back to first slide after last
                  </span>
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

              {/* Autoplay and Loop controls for floater */}
              <div>
                <Label className="font-medium">Autoplay</Label>
                <div className="mt-1 flex items-center space-x-2">
                  <Switch checked={autoplay} onCheckedChange={setAutoplay} />
                  <span className="text-sm">Automatically play the story</span>
                </div>
              </div>
              <div>
                <Label className="font-medium">Loop</Label>
                <div className="mt-1 flex items-center space-x-2">
                  <Switch checked={loop} onCheckedChange={setLoop} />
                  <span className="text-sm">
                    Loop back to first slide after last
                  </span>
                </div>
              </div>

              {/* Story Size (applies to story rendered inside floater) */}
              <div>
                <Label className="font-medium">
                  Story Size (inside floater)
                </Label>
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
                      placeholder="Story width (px)"
                    />
                    <Input
                      type="number"
                      min={100}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      placeholder="Story height (px)"
                    />
                  </div>
                )}
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
                  onValueChange={(
                    value: 'small' | 'medium' | 'large' | 'custom'
                  ) => setFloaterSize(value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small (200×350)</SelectItem>
                    <SelectItem value="medium">Medium (280×490)</SelectItem>
                    <SelectItem value="large">Large (360×630)</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {floaterSize === 'custom' && (
                  <div className="mt-2 flex gap-2">
                    <Input
                      type="number"
                      min={100}
                      value={floaterCustomWidth}
                      onChange={(e) =>
                        setFloaterCustomWidth(Number(e.target.value))
                      }
                      placeholder="Floater width (px)"
                    />
                    <Input
                      type="number"
                      min={100}
                      value={floaterCustomHeight}
                      onChange={(e) =>
                        setFloaterCustomHeight(Number(e.target.value))
                      }
                      placeholder="Floater height (px)"
                    />
                  </div>
                )}
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
            <div className="mt-1 space-y-4">
              {/* Head Code */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Add this to your &lt;head&gt; section:
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy('head')}
                    className="h-6 px-2"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full rounded border bg-muted p-2 font-mono text-xs"
                    rows={2}
                    value={embedCode.head}
                    readOnly
                  />
                </div>
              </div>

              {/* Body Code */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Add this to your &lt;body&gt; section:
                  </Label>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy('body')}
                    className="h-6 px-2"
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <div className="relative">
                  <textarea
                    className="w-full rounded border bg-muted p-2 font-mono text-xs"
                    rows={4}
                    value={embedCode.body}
                    readOnly
                  />
                </div>
              </div>

              {/* Copy All Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => handleCopy('all')}
                  className="h-8"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy All Code
                </Button>
              </div>
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

import { Button } from '@/components/ui/button'
import { Trash2, Image, Video, Link } from 'lucide-react'

interface StoryFrame {
  id: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  order: number
  name?: string
  link?: string
}

interface FrameSelectorProps {
  frames: StoryFrame[]
  selectedFrameId: string
  onFrameSelect: (frameId: string) => void
  onRemoveFrame: (frameId: string) => void
}

export default function FrameSelector({
  frames,
  selectedFrameId,
  onFrameSelect,
  onRemoveFrame,
}: FrameSelectorProps) {
  return (
    <div className="space-y-3">
      {frames.map((frame) => (
        <div
          key={frame.id}
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-3 transition-all hover:border-border ${
            selectedFrameId === frame.id
              ? 'border-primary bg-primary/10'
              : frame.link
                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950'
                : 'border-border bg-muted/50'
          }`}
          onClick={() => onFrameSelect(frame.id)}
          title={frame.link ? `Click to open: ${frame.link}` : undefined}
        >
          {/* Frame Content */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-background">
                {frame.mediaUrl ? (
                  frame.mediaType === 'image' ? (
                    <Image className="h-6 w-6 text-muted-foreground" />
                  ) : (
                    <Video className="h-6 w-6 text-muted-foreground" />
                  )
                ) : (
                  <div className="text-xs text-muted-foreground">Empty</div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {frame.name
                      ? frame.name.length > 20
                        ? `${frame.name.substring(0, 20)}...`
                        : frame.name
                      : `Frame ${frame.order}`}
                  </span>
                  {frame.link && (
                    <div className="flex items-center space-x-1 rounded-full bg-primary/10 px-1.5 py-0.5">
                      <Link className="h-3 w-3 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        Link
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {frame.mediaUrl
                    ? `${frame.mediaType === 'image' ? 'Image' : 'Video'} uploaded`
                    : 'No media'}
                </div>
              </div>
            </div>

            {/* Remove Button */}
            {frames.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveFrame(frame.id)
                }}
                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

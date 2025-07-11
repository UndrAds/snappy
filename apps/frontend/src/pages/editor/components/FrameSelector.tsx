import { Button } from '@/components/ui/button'
import { Trash2, Image, Video } from 'lucide-react'

interface StoryFrame {
  id: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  order: number
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
          className={`relative cursor-pointer rounded-lg border-2 border-dashed p-3 transition-all hover:border-gray-400 ${
            selectedFrameId === frame.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50'
          }`}
          onClick={() => onFrameSelect(frame.id)}
        >
          {/* Frame Content */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white">
                {frame.mediaUrl ? (
                  frame.mediaType === 'image' ? (
                    <Image className="h-6 w-6 text-gray-600" />
                  ) : (
                    <Video className="h-6 w-6 text-gray-600" />
                  )
                ) : (
                  <div className="text-xs text-gray-400">Empty</div>
                )}
              </div>
              <div>
                <div className="font-medium">Frame {frame.order}</div>
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
                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
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

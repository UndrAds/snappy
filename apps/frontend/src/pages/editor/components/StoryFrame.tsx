import { Video } from 'lucide-react'

interface StoryFrameProps {
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  order: number
  isSelected?: boolean
  onClick?: () => void
}

export default function StoryFrame({
  mediaUrl,
  mediaType,
  order,
  isSelected = false,
  onClick,
}: StoryFrameProps) {
  return (
    <div
      className={`relative h-24 w-24 cursor-pointer overflow-hidden rounded-lg border-2 border-dashed transition-all hover:border-gray-400 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
      onClick={onClick}
    >
      {mediaUrl ? (
        mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt={`Frame ${order}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black">
            <Video className="h-8 w-8 text-white" />
          </div>
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <div className="text-xs text-gray-400">Frame {order}</div>
            <div className="text-xs text-gray-300">Empty</div>
          </div>
        </div>
      )}

      {/* Frame Number Badge */}
      <div className="absolute bottom-1 right-1 rounded-full bg-black/50 px-1.5 py-0.5 text-xs text-white">
        {order}
      </div>
    </div>
  )
}

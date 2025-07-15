import { IMAGE_FILTERS, ImageFilter } from '@/lib/skins'

interface MediaSkinProps {
  src: string
  type: 'image' | 'video'
  filters?: ImageFilter[]
  selectedFilter?: string
  onSelect?: (filterName: string) => void
}

export default function MediaSkin({
  src,
  type,
  filters = IMAGE_FILTERS,
  selectedFilter,
  onSelect,
}: MediaSkinProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {filters.map((filter) => (
        <div
          key={filter.name}
          className={`flex cursor-pointer flex-col items-center rounded-lg border p-1 transition-all ${
            selectedFilter === filter.name
              ? 'border-blue-500 ring-2 ring-blue-300'
              : 'border-gray-200'
          }`}
          onClick={() => onSelect?.(filter.name)}
        >
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-md bg-gray-100">
            {type === 'image' ? (
              <img
                src={src}
                alt={filter.name}
                style={{
                  filter: filter.css,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <video
                src={src}
                style={{
                  filter: filter.css,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                muted
                loop
                playsInline
                autoPlay
              />
            )}
          </div>
          <span className="mt-1 text-center text-xs font-medium text-gray-700">
            {filter.name}
          </span>
        </div>
      ))}
    </div>
  )
}

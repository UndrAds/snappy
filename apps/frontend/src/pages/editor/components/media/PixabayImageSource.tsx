import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const PIXABAY_API_KEY = '51328600-ef12ef4fc24e9d409afc56ba5'

interface PixabayImageSourceProps {
  onSelect: (media: { url: string; type: 'image'; source: string }) => void
}

export default function PixabayImageSource({
  onSelect,
}: PixabayImageSourceProps) {
  const [query, setQuery] = useState('nature')
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchImages = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(query)}&image_type=photo&per_page=30&safesearch=true`
      )
      const data = await res.json()
      setImages(data.hits || [])
    } catch (err) {
      setError('Failed to fetch images')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    searchImages()
  }, [])

  return (
    <div>
      <form onSubmit={searchImages} className="mb-4 flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search images..."
        />
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>
      {error && <div className="mb-2 text-red-500">{error}</div>}
      <div className="grid max-h-[400px] grid-cols-3 gap-4 overflow-y-auto">
        {loading && <div className="col-span-3 text-center">Loading...</div>}
        {images.map((img) => (
          <button
            key={img.id}
            className="group relative aspect-[3/4] overflow-hidden rounded border hover:ring-2 hover:ring-blue-500"
            onClick={() =>
              onSelect({
                url: img.webformatURL,
                type: 'image',
                source: 'pixabay',
              })
            }
            type="button"
          >
            <img
              src={img.webformatURL}
              alt={img.tags}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute bottom-1 right-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white opacity-80">
              Pixabay
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

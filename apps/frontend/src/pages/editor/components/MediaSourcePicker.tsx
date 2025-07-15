import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Image } from 'lucide-react'
import MediaSourceModal from './media/MediaSourceModal'

export default function MediaSourcePicker({
  type = 'image',
  onChange,
}: {
  type?: 'image' | 'video'
  value?: string
  onChange?: (url: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mediaModalOpen, setMediaModalOpen] = useState(false)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      onChange?.(url)
    }
  }

  const handleOnlineSelect = (media: {
    url: string
    type: 'image' | 'video'
    source: string
  }) => {
    if (media.type === type) {
      onChange?.(media.url)
    }
    setMediaModalOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" /> Upload{' '}
        {type === 'image' ? 'Image' : 'Video'}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={type === 'image' ? 'image/*' : 'video/*'}
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button variant="outline" onClick={() => setMediaModalOpen(true)}>
        <Image className="mr-2 h-4 w-4" /> Add from Online Source
      </Button>
      {mediaModalOpen && (
        <MediaSourceModal
          open={mediaModalOpen}
          onClose={() => setMediaModalOpen(false)}
          onSelect={handleOnlineSelect}
        />
      )}
    </div>
  )
}

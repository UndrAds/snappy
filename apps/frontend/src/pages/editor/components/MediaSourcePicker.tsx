import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Image } from 'lucide-react'
import { toast } from 'sonner'
import { uploadAPI } from '@/lib/api'
import MediaSourceModal from './media/MediaSourceModal'

export default function MediaSourcePicker({
  type = 'image',
  onChange,
  canAddMedia = true,
  onDisabledClick,
}: {
  type?: 'image' | 'video'
  value?: string
  onChange?: (url: string) => void
  canAddMedia?: boolean
  onDisabledClick?: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleUploadClick = () => {
    if (!canAddMedia && onDisabledClick) {
      onDisabledClick()
      return
    }
    fileInputRef.current?.click()
  }

  const handleOnlineSourceClick = () => {
    if (!canAddMedia && onDisabledClick) {
      onDisabledClick()
      return
    }
    setMediaModalOpen(true)
  }

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      try {
        setIsUploading(true)

        // Upload file to backend
        const response = await uploadAPI.uploadSingle(file)

        if (response.success && response.data) {
          onChange?.(response.data.url)
          toast.success('File uploaded successfully!')
        } else {
          toast.error('Failed to upload file')
        }
      } catch (error) {
        console.error('Upload error:', error)
        toast.error('Failed to upload file')
      } finally {
        setIsUploading(false)
      }
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
      <Button
        variant="outline"
        onClick={handleUploadClick}
        disabled={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading
          ? 'Uploading...'
          : `Upload ${type === 'image' ? 'Image' : 'Video'}`}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={type === 'image' ? 'image/*' : 'video/*'}
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button variant="outline" onClick={handleOnlineSourceClick}>
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

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PixabayImageSource from './PixabayImageSource'
import { X } from 'lucide-react'
// import PixabayVideoSource from './PixabayVideoSource'
// import GettyImageSource from './GettyImageSource'
// import GettyVideoSource from './GettyVideoSource'

interface MediaSourceModalProps {
  open: boolean
  onClose: () => void
  onSelect: (media: {
    url: string
    type: 'image' | 'video'
    source: string
  }) => void
}

export default function MediaSourceModal({
  open,
  onClose,
  onSelect,
}: MediaSourceModalProps) {
  const [activeTab, setActiveTab] = useState('pixabay-images')

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Media from Online Source</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pixabay-images">Pixabay Images</TabsTrigger>
            <TabsTrigger value="pixabay-videos">Pixabay Videos</TabsTrigger>
            <TabsTrigger value="getty-images">Getty Images</TabsTrigger>
            <TabsTrigger value="getty-videos">Getty Videos</TabsTrigger>
          </TabsList>
          <TabsContent value="pixabay-images">
            <PixabayImageSource onSelect={onSelect} />
          </TabsContent>
          <TabsContent value="pixabay-videos">
            {/* <PixabayVideoSource onSelect={onSelect} /> */}
            <div className="p-8 text-center text-muted-foreground">
              Coming soon
            </div>
          </TabsContent>
          <TabsContent value="getty-images">
            {/* <GettyImageSource onSelect={onSelect} /> */}
            <div className="p-8 text-center text-muted-foreground">
              Coming soon
            </div>
          </TabsContent>
          <TabsContent value="getty-videos">
            {/* <GettyVideoSource onSelect={onSelect} /> */}
            <div className="p-8 text-center text-muted-foreground">
              Coming soon
            </div>
          </TabsContent>
        </Tabs>
        <DialogClose asChild>
          <button className="absolute right-4 top-4 text-gray-400 hover:text-gray-900">
            <X className="h-4 w-4" />
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}

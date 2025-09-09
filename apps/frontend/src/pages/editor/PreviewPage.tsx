import { useLocation, useNavigate } from 'react-router-dom'
import StoryFrame from '@/components/StoryFrame'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import EmbedModal from './components/EmbedModal'

declare global {
  interface Window {
    googletag: any
  }
}

export default function PreviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [storyData, setStoryData] = useState<any>(null)
  const [frames, setFrames] = useState<any>(null)
  const [current, setCurrent] = useState(0)
  const [embedOpen, setEmbedOpen] = useState(false)

  useEffect(() => {
    if ((window as any).previewData) {
      console.log('Preview data from window:', window.previewData)
      setStoryData(window.previewData.storyData)
      setFrames(window.previewData.frames)
      // Optionally clear previewData after reading
      window.previewData = undefined
    } else if (location.state) {
      console.log('Preview data from location state:', location.state)
      setStoryData(location.state.storyData)
      setFrames(location.state.frames)
    }
  }, [location.state])

  // Load ad scripts for preview
  useEffect(() => {
    // Load undrads.js
    if (!document.querySelector('script[src="/undrads.js"]')) {
      const undradsScript = document.createElement('script')
      undradsScript.src = '/undrads.js'
      undradsScript.async = true
      document.head.appendChild(undradsScript)
    }
  }, [])

  if (!storyData || !frames) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <p className="mb-4 text-lg">No story data to preview.</p>
        <Button onClick={() => navigate(-1)}>Back to Editor</Button>
      </div>
    )
  }

  const handleNext = () => {
    if (current < frames.length - 1) setCurrent(current + 1)
  }
  const handlePrev = () => {
    if (current > 0) setCurrent(current - 1)
  }
  const handleClose = () => navigate(-1)
  const handleEmbed = () => {
    setEmbedOpen(true)
  }

  const frame = frames[current]
  console.log('Current frame in preview:', frame)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="absolute left-4 top-4 flex gap-2">
        <Button variant="ghost" onClick={handleClose}>
          Back
        </Button>
        <Button variant="outline" onClick={handleEmbed}>
          Embed
        </Button>
      </div>
      <EmbedModal
        open={embedOpen}
        onClose={() => setEmbedOpen(false)}
        storyId={storyData?.storyTitle || 'demo'}
        storyData={{ story: storyData, frames }}
      />
      <div className="relative flex items-center justify-center">
        <StoryFrame
          publisherName={storyData.publisherName}
          storyTitle={storyData.storyTitle}
          publisherPic={storyData.publisherPic}
          ctaType={storyData.ctaType}
          currentSlide={current + 1}
          totalSlides={frames.length}
          showProgressBar
          frameType={frame.type}
          elements={frame.elements}
          background={frame.background}
          adConfig={frame.adConfig}
          isEditMode={false}
          showPublisherInfo
          showCTA
          format={storyData.format}
          deviceFrame={storyData.deviceFrame}
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
          <div
            className="pointer-events-auto h-full w-1/3"
            onClick={handlePrev}
          ></div>
          <div
            className="pointer-events-auto h-full w-1/3"
            onClick={handleNext}
          ></div>
        </div>
      </div>
      <div className="mt-4 flex space-x-2">
        <Button onClick={handlePrev} disabled={current === 0} variant="outline">
          Prev
        </Button>
        <Button
          onClick={handleNext}
          disabled={current === frames.length - 1}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

import { useLocation, useNavigate } from 'react-router-dom'
import StoryFrame from '@/components/StoryFrame'
import { Button } from '@/components/ui/button'
import { useState, useEffect, useRef } from 'react'

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
  const initializedAdSlotsRef = useRef<Set<string>>(new Set())
  const displayedAdSlotsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if ((window as any).previewData) {
      console.log('Preview data from window:', window.previewData)
      const sd = window.previewData.storyData
      const fr = window.previewData.frames
      setStoryData(sd)
      // Don't filter ad frames on initial load - they should be visible
      setFrames(fr || [])
      // Optionally clear previewData after reading
      window.previewData = undefined
    } else if (location.state) {
      console.log('Preview data from location state:', location.state)
      const sd = location.state.storyData
      const fr = location.state.frames
      setStoryData(sd)
      // Don't filter ad frames on initial load - they should be visible
      setFrames(fr || [])
    }
  }, [location.state])

  // Load Google Publisher Tag for preview
  useEffect(() => {
    // Load Google Publisher Tag
    if (!document.querySelector('script[src*="gpt.js"]')) {
      const gptScript = document.createElement('script')
      gptScript.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js'
      gptScript.async = true
      document.head.appendChild(gptScript)
    }
  }, [])

  // Initialize and display GPT ad for the current ad frame in preview
  useEffect(() => {
    const cur = frames && frames[current]
    if (!cur || cur.type !== 'ad' || !cur.adConfig) return

    // Use adId from adConfig if available, otherwise use frame index
    const adId = cur.adConfig.adId || `snappy-ad-${current}`

    // Check if this ad slot has already been initialized and displayed
    if (
      initializedAdSlotsRef.current.has(adId) &&
      displayedAdSlotsRef.current.has(adId)
    ) {
      // Already initialized and displayed, skip
      return
    }

    try {
      if (!window.googletag) {
        (window as any).googletag = { cmd: [] }
      }
      const adUnitPath: string | undefined = cur.adConfig.adUnitPath
      if (!adUnitPath) return

      // Use adId as slotId to match embed script pattern
      const slotId = adId
      const sizes =
        Array.isArray(cur.adConfig.sizes) && cur.adConfig.sizes.length
          ? cur.adConfig.sizes
          : Array.isArray(cur.adConfig.size)
            ? [cur.adConfig.size]
            : [[300, 250]]

      const defineAndDisplay = () => {
        try {
          // Wait a bit for the div to be rendered
          setTimeout(() => {
            const adDiv = document.getElementById(slotId)
            if (!adDiv) {
              console.warn('PreviewPage: Ad div not found:', slotId)
              return
            }

            // Check if slot already exists in GPT
            const existing = window.googletag
              .pubads()
              .getSlots()
              .some((slot: any) => {
                try {
                  return slot.getSlotElementId() === slotId
                } catch {
                  return false
                }
              })

            // Only create and initialize if not already done
            if (!existing && !initializedAdSlotsRef.current.has(slotId)) {
              const slot = window.googletag.defineSlot(
                adUnitPath,
                sizes,
                slotId
              )
              if (slot) {
                slot.addService(window.googletag.pubads())
                window.googletag.pubads().enableSingleRequest()
                window.googletag.pubads().enableAsyncRendering()
                window.googletag.enableServices()

                // Mark as initialized
                initializedAdSlotsRef.current.add(slotId)
              }
            } else if (existing && !initializedAdSlotsRef.current.has(slotId)) {
              // Slot exists but not in our tracking - mark it as initialized
              initializedAdSlotsRef.current.add(slotId)
            }

            // Display the ad only once per slot
            if (
              initializedAdSlotsRef.current.has(slotId) &&
              !displayedAdSlotsRef.current.has(slotId)
            ) {
              window.googletag.display(slotId)
              displayedAdSlotsRef.current.add(slotId)
            }
          }, 100)
        } catch (e) {
          console.warn('PreviewPage: Failed to display ad', e)
        }
      }

      if (window.googletag.defineSlot) {
        defineAndDisplay()
      } else if (window.googletag.cmd) {
        window.googletag.cmd.push(defineAndDisplay)
      }
    } catch (e) {
      console.warn('PreviewPage: Error initializing ad', e)
    }
  }, [current, frames])

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

  const frame = frames[current]
  console.log('Current frame in preview:', frame)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black">
      <div className="relative flex items-center justify-center">
        <StoryFrame
          publisherName={storyData.publisherName}
          storyTitle={storyData.storyTitle}
          publisherPic={storyData.publisherPic}
          currentSlide={(() => {
            // Count story frames up to current index (exclude ads)
            let storyIdx = 0
            for (let j = 0; j <= current; j++) {
              if (frames[j] && frames[j].type !== 'ad') storyIdx++
            }
            return storyIdx
          })()}
          totalSlides={frames.filter((f: any) => f && f.type !== 'ad').length}
          showProgressBar
          frameType={frame.type}
          elements={frame.elements}
          background={frame.background}
          adConfig={
            frame.type === 'ad' && frame.adConfig
              ? {
                  ...frame.adConfig,
                  adId: 'snappy-ad-' + current, // Use frame index to match embed script pattern
                }
              : frame.adConfig
          }
          link={frame.link}
          linkText={frame.linkText}
          isEditMode={false}
          showPublisherInfo
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

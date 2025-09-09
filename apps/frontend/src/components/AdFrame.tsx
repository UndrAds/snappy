import { useEffect, useRef } from 'react'
import { googleAdsManager } from '@/utils/googleAds'

interface AdFrameProps {
  adId: string
  adUnitPath?: string
  size?: [number, number]
  isEditMode?: boolean
  className?: string
}

export default function AdFrame({
  adId,
  adUnitPath = '/6355419/Travel/Europe/France/Paris',
  size = [300, 250],
  isEditMode = false,
  className = '',
}: AdFrameProps) {
  const adContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('AdFrame useEffect:', {
      adId,
      adUnitPath,
      isEditMode,
      adContainerRef: adContainerRef.current,
    })

    if (isEditMode) {
      // In edit mode, just show a placeholder
      return
    }

    // Create ad slot using the manager
    const createAd = async () => {
      if (!adContainerRef.current) return

      try {
        await googleAdsManager.createSlot(
          adId,
          adUnitPath,
          size,
          adContainerRef.current
        )
      } catch (error) {
        console.error('Error creating ad slot:', error)
      }
    }

    createAd()

    // Cleanup function
    return () => {
      if (!isEditMode) {
        googleAdsManager.destroySlot(adId)
      }
    }
  }, [adId, adUnitPath, size, isEditMode])

  if (isEditMode) {
    return (
      <div
        ref={adContainerRef}
        id={adId}
        className={`flex items-center justify-center border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-100 to-red-100 ${className}`}
        style={{ width: size[0], height: size[1] }}
      >
        <div className="text-center">
          <div className="mb-2 font-semibold text-orange-600">Ad Frame</div>
          <div className="text-sm text-orange-500">
            Advertisement will appear here
          </div>
          <div className="mt-1 text-xs text-orange-400">ID: {adId}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={adContainerRef}
      id={adId}
      className={`flex items-center justify-center bg-black ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      {/* Google Ad Manager ad will be rendered here by GPT */}
    </div>
  )
}

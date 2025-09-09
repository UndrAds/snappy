import { useEffect, useRef } from 'react'

interface AdFrameProps {
  adId: string
  adUnitPath?: string
  size?: [number, number]
  isEditMode?: boolean
  className?: string
}

declare global {
  interface Window {
    googletag: any
  }
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
      isEditMode,
      adContainerRef: adContainerRef.current,
    })
    if (isEditMode) {
      // In edit mode, just show a placeholder
      return
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
      className={`flex items-center justify-center bg-black ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <ins
        className="undrads ua-display"
        data-ad-id={adId}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  )
}

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Megaphone } from 'lucide-react'

interface AdFrameProps {
  element: {
    id: string
    type: 'ad'
    adConfig?: {
      adId: string
      adUnitPath?: string
      size?: [number, number]
    }
  }
  onElementUpdate: (elementId: string, updates: any) => void
  onFrameUpdate: (frameId: string, updates: any) => void
}

const AD_OPTIONS = [
  {
    id: 'UNDR/1234/mobile/300X250/mobile-ad-1',
    label: 'Mobile Ad 1 (300x250)',
    size: [300, 250],
  },
  {
    id: 'UNDR/1234/mobile/320X50/sticky-bottom-mobile-ad-1',
    label: 'Sticky Bottom Mobile Ad 1 (320x50)',
    size: [320, 50],
  },
  {
    id: 'UNDR/1234/mobile/300X250/mobile-ad-2',
    label: 'Mobile Ad 2 (300x250)',
    size: [300, 250],
  },
  {
    id: 'UNDR/1234/mobile/320X100/sticky-bottom-mobile-ad-2',
    label: 'Sticky Bottom Mobile Ad 2 (320x100)',
    size: [320, 100],
  },
  {
    id: '/22931425847/Test_VAST_Tag_Code',
    label: 'Video Ad (VAST)',
    size: [300, 250],
  },
]

export default function PropertyPanelAdFrame({
  element,
  onElementUpdate,
  onFrameUpdate,
}: AdFrameProps) {
  const [selectedAd, setSelectedAd] = useState(
    element.adConfig?.adId || AD_OPTIONS[0].id
  )

  const handleAdChange = (adId: string) => {
    const adOption = AD_OPTIONS.find((option) => option.id === adId)
    if (adOption) {
      setSelectedAd(adId)
      onFrameUpdate(element.id, {
        adConfig: {
          adId: adId,
          adUnitPath: adId,
          size: adOption.size,
        },
      })
    }
  }

  const selectedAdOption = AD_OPTIONS.find((option) => option.id === selectedAd)

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Megaphone className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Ad Frame Properties</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ad-select">Ad Type</Label>
          <Select value={selectedAd} onValueChange={handleAdChange}>
            <SelectTrigger id="ad-select">
              <SelectValue placeholder="Select an ad type" />
            </SelectTrigger>
            <SelectContent>
              {AD_OPTIONS.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAdOption && (
          <div className="space-y-2">
            <Label>Ad Details</Label>
            <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
              <div className="text-sm">
                <span className="font-medium">Ad ID:</span>{' '}
                <code className="rounded bg-white px-2 py-1 text-xs">
                  {selectedAdOption.id}
                </code>
              </div>
              <div className="text-sm">
                <span className="font-medium">Size:</span>{' '}
                {selectedAdOption.size[0]}x{selectedAdOption.size[1]}px
              </div>
              <div className="text-sm">
                <span className="font-medium">Type:</span>{' '}
                {selectedAdOption.id.includes('VAST')
                  ? 'Video Ad'
                  : 'Display Ad'}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex items-center justify-center rounded-lg border bg-black p-4">
            <div className="text-center text-white">
              <Megaphone className="mx-auto mb-2 h-8 w-8 text-orange-400" />
              <div className="text-sm">Ad Frame</div>
              <div className="text-xs text-gray-400">
                {selectedAdOption?.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

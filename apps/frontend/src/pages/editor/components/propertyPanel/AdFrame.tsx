import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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

// Default test ad code
const DEFAULT_AD_CODE = '/6355419/Travel/Europe/France/Paris'

export default function PropertyPanelAdFrame({
  element,
  onFrameUpdate,
}: AdFrameProps) {
  const [adCode, setAdCode] = useState(
    element.adConfig?.adUnitPath || DEFAULT_AD_CODE
  )

  const handleAdCodeChange = (value: string) => {
    setAdCode(value)
    onFrameUpdate(element.id, {
      adConfig: {
        adId: value,
        adUnitPath: value,
        size: [300, 250], // Default size for Google Ads
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Megaphone className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Ad Frame Properties</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ad-code">Ad Unit Code</Label>
          <Input
            id="ad-code"
            placeholder="Enter your Google Ad Manager ad unit code"
            value={adCode}
            onChange={(e) => handleAdCodeChange(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Enter your Google Ad Manager ad unit path (e.g.,
            /6355419/Travel/Europe/France/Paris)
          </p>
        </div>

        <div className="space-y-2">
          <Label>Ad Details</Label>
          <div className="space-y-2 rounded-lg border bg-gray-50 p-3">
            <div className="text-sm">
              <span className="font-medium">Ad Unit:</span>{' '}
              <code className="rounded bg-white px-2 py-1 text-xs">
                {adCode}
              </code>
            </div>
            <div className="text-sm">
              <span className="font-medium">Size:</span> 300x250px (Default)
            </div>
            <div className="text-sm">
              <span className="font-medium">Type:</span> Google Ad Manager
              Display Ad
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex items-center justify-center rounded-lg border bg-black p-4">
            <div className="text-center text-white">
              <Megaphone className="mx-auto mb-2 h-8 w-8 text-orange-400" />
              <div className="text-sm">Ad Frame</div>
              <div className="text-xs text-gray-400">Google Ad Manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

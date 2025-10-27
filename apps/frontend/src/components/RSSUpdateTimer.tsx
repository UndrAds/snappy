import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, RefreshCw, Settings } from 'lucide-react'
import { rssAPI } from '@/lib/api'
import { toast } from 'sonner'

interface RSSUpdateTimerProps {
  storyId: string
  rssConfig: {
    updateIntervalMinutes: number
    lastUpdated?: string
    nextUpdate?: string
    isActive: boolean
  }
  onUpdateTriggered?: () => void
}

export default function RSSUpdateTimer({
  storyId,
  rssConfig,
  onUpdateTriggered,
}: RSSUpdateTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!rssConfig.nextUpdate) return 'Unknown'

      const now = new Date()
      const nextUpdate = new Date(rssConfig.nextUpdate)
      const diff = nextUpdate.getTime() - now.getTime()

      if (diff <= 0) {
        return 'Due for update'
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`
      } else {
        return `${seconds}s`
      }
    }

    // Update immediately
    setTimeLeft(calculateTimeLeft())

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [rssConfig.nextUpdate])

  const handleManualUpdate = async () => {
    try {
      setIsUpdating(true)
      await rssAPI.triggerRSSUpdate(storyId)
      toast.success('RSS update triggered')
      onUpdateTriggered?.()
    } catch (error) {
      console.error('Error triggering RSS update:', error)
      toast.error('Failed to trigger RSS update')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = () => {
    if (!rssConfig.isActive) return 'bg-gray-500'
    if (timeLeft === 'Due for update') return 'bg-orange-500'
    return 'bg-green-500'
  }

  const getStatusText = () => {
    if (!rssConfig.isActive) return 'Disabled'
    if (timeLeft === 'Due for update') return 'Update Due'
    return 'Active'
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          RSS Auto-Update
        </CardTitle>
        <CardDescription className="text-xs">
          Next update in: {timeLeft}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={getStatusColor()}>
              {getStatusText()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Every {rssConfig.updateIntervalMinutes} min
            </span>
          </div>

          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualUpdate}
              disabled={isUpdating}
              className="h-7 px-2"
            >
              <RefreshCw
                className={`h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`}
              />
            </Button>
            <Button size="sm" variant="outline" className="h-7 px-2">
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {rssConfig.lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(rssConfig.lastUpdated).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
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
  variant?: 'card' | 'navbar'
}

export default function RSSUpdateTimer({
  storyId,
  rssConfig,
  onUpdateTriggered,
  variant = 'card',
}: RSSUpdateTimerProps) {
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [open, setOpen] = useState(false)

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

  if (variant === 'navbar') {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="relative h-8 px-2"
          title={`RSS ${getStatusText()} — ${timeLeft || 'Unknown'}`}
        >
          <RefreshCw
            className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`}
          />
          <span
            className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${getStatusColor()}`}
          />
        </Button>
        <span
          className={`text-xs ${
            !rssConfig.isActive
              ? 'text-gray-500'
              : timeLeft === 'Due for update'
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-muted-foreground'
          }`}
          title={
            rssConfig.nextUpdate
              ? new Date(rssConfig.nextUpdate).toLocaleString()
              : 'Unknown'
          }
        >
          Next: {timeLeft || 'Unknown'}
        </span>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> RSS Auto-Update
              </DialogTitle>
              <DialogDescription>
                See timing and manually trigger updates.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={getStatusColor()}>
                    {getStatusText()}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Every {rssConfig.updateIntervalMinutes} min
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManualUpdate}
                    disabled={isUpdating}
                  >
                    <RefreshCw
                      className={`mr-2 h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`}
                    />
                    Trigger Update
                  </Button>
                </div>
              </div>

              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Next update in:</span>
                  <span>{timeLeft || 'Unknown'}</span>
                </div>
                {rssConfig.lastUpdated && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Last updated:</span>
                    <span>
                      {new Date(rssConfig.lastUpdated).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
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

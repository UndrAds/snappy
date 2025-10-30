import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { rssAPI } from '@/lib/api'
import { toast } from 'sonner'

interface RSSProcessingStatus {
  storyId: string
  status: 'processing' | 'completed' | 'failed'
  progress: number
  message?: string
  framesGenerated?: number
  totalFrames?: number
}

interface RSSProgressLoaderProps {
  storyId: string
  onComplete: () => void
  onError: () => void
}

export default function RSSProgressLoader({
  storyId,
  onComplete,
  onError,
}: RSSProgressLoaderProps) {
  const [status, setStatus] = useState<RSSProcessingStatus | null>(null)
  const [, setIsPolling] = useState(true)

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await rssAPI.getProcessingStatus(storyId)

        if (response.success && response.data) {
          setStatus(response.data)

          if (response.data.status === 'completed') {
            setIsPolling(false)
            toast.success('RSS processing completed successfully!')
            setTimeout(() => onComplete(), 1000)
          } else if (response.data.status === 'failed') {
            setIsPolling(false)
            toast.error('RSS processing failed')
            onError()
          }
        }
      } catch (error) {
        console.error('Error polling RSS status:', error)
        setIsPolling(false)
        onError()
      }
    }

    // Poll immediately
    pollStatus()

    // Set up polling interval
    const interval = setInterval(pollStatus, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [storyId, onComplete, onError])

  const handleRetry = async () => {
    try {
      await rssAPI.triggerRSSUpdate(storyId)
      setIsPolling(true)
      toast.success('RSS update triggered')
    } catch (error) {
      console.error('Error triggering RSS update:', error)
      toast.error('Failed to trigger RSS update')
    }
  }

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="h-6 w-6 animate-spin" />

    switch (status.status) {
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'failed':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Loader2 className="h-6 w-6 animate-spin" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {getStatusIcon()}
            RSS Processing
          </CardTitle>
          <CardDescription>Generating frames from RSS feed...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{status.progress}%</span>
                </div>
                <Progress value={status.progress} className="h-2" />
              </div>

              {status.message && (
                <p className="text-center text-sm text-muted-foreground">
                  {status.message}
                </p>
              )}

              {status.framesGenerated !== undefined &&
                status.totalFrames !== undefined && (
                  <p className="text-center text-sm">
                    Generated {status.framesGenerated} of {status.totalFrames}{' '}
                    frames
                  </p>
                )}

              {status.status === 'failed' && (
                <div className="flex justify-center">
                  <Button onClick={handleRetry} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              )}
            </>
          )}

          {!status && (
            <div className="text-center">
              <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" />
              <p className="text-sm text-muted-foreground">
                Initializing RSS processing...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Download, AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { storyAPI } from '@/lib/api'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  storyId: string
  storyTitle?: string
}

const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  storyId,
  storyTitle: _storyTitle,
}) => {
  const [exportType, setExportType] = useState<'standard' | 'app-campaigns'>(
    'standard'
  )
  const [isExporting, setIsExporting] = useState(false)
  const [exportInfo, setExportInfo] = useState<{
    storyFrames: number
    imageCount: number
    estimatedFiles: number
    maxSize: number
    maxFiles: number
    constraints: {
      fileSize: { limit: number; limitKB: number }
      fileCount: { limit: number; estimated: number }
    }
  } | null>(null)
  const [isLoadingInfo, setIsLoadingInfo] = useState(false)

  useEffect(() => {
    if (open && storyId) {
      loadExportInfo()
    }
  }, [open, storyId, exportType])

  const loadExportInfo = async () => {
    try {
      setIsLoadingInfo(true)
      const response = await storyAPI.getExportInfo(storyId, exportType)
      if (response.success && response.data) {
        setExportInfo(response.data)
      }
    } catch (error) {
      console.error('Failed to load export info:', error)
    } finally {
      setIsLoadingInfo(false)
    }
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await storyAPI.exportToH5Ads(storyId, exportType)
      toast.success('Export started! Your download should begin shortly.')
      onClose()
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error(
        error.response?.data?.error?.message || 'Failed to export story'
      )
    } finally {
      setIsExporting(false)
    }
  }

  const getFileSizeWarning = () => {
    if (!exportInfo) return null
    // Estimate file size (rough calculation)
    const estimatedSizeKB = exportInfo.imageCount * 50 + 10 // ~50KB per image + 10KB for HTML/CSS/JS
    const limitKB = exportInfo.constraints.fileSize.limitKB

    if (estimatedSizeKB > limitKB * 0.8) {
      return {
        type: 'warning' as const,
        message: `Estimated file size (${estimatedSizeKB} KB) is close to the limit (${limitKB} KB). Images will be compressed.`,
      }
    }
    return null
  }

  const fileSizeWarning = getFileSizeWarning()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export to Google H5 Ads
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label>Export Type</Label>
            <RadioGroup
              value={exportType}
              onValueChange={(value) =>
                setExportType(value as 'standard' | 'app-campaigns')
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label
                  htmlFor="standard"
                  className="cursor-pointer font-normal"
                >
                  Standard Display Network
                </Label>
              </div>
              <div className="ml-6 text-sm text-muted-foreground">
                Max 600 KB, up to 40 files
              </div>
              <div className="mt-2 flex items-center space-x-2">
                <RadioGroupItem value="app-campaigns" id="app-campaigns" />
                <Label
                  htmlFor="app-campaigns"
                  className="cursor-pointer font-normal"
                >
                  App Campaigns / Playable Ads
                </Label>
              </div>
              <div className="ml-6 text-sm text-muted-foreground">
                Max 5 MB, up to 512 files
              </div>
            </RadioGroup>
          </div>

          {/* Export Info */}
          {isLoadingInfo ? (
            <div className="text-sm text-muted-foreground">
              Loading export info...
            </div>
          ) : exportInfo ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Story Frames</div>
                  <div className="text-2xl font-bold">
                    {exportInfo.storyFrames}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    (Ad frames excluded)
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Images</div>
                  <div className="text-2xl font-bold">
                    {exportInfo.imageCount}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Estimated Files</div>
                  <div className="text-2xl font-bold">
                    {exportInfo.estimatedFiles}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Max: {exportInfo.maxFiles}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Size Limit</div>
                  <div className="text-2xl font-bold">
                    {exportInfo.constraints.fileSize.limitKB} KB
                  </div>
                </div>
              </div>

              {fileSizeWarning && (
                <div
                  className={`rounded-md border p-3 ${
                    fileSizeWarning.type === 'warning'
                      ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">Warning</div>
                      <div className="text-sm text-muted-foreground">
                        {fileSizeWarning.message}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {exportInfo.estimatedFiles > exportInfo.maxFiles && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="text-sm font-medium">
                        File Count Exceeded
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Estimated files ({exportInfo.estimatedFiles}) exceeds
                        the limit ({exportInfo.maxFiles}). Consider reducing the
                        number of images.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Google H5 Ads Rules */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <Label className="text-base font-semibold">
                Google H5 Ads Requirements
              </Label>
            </div>
            <div className="space-y-2 pl-6 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <strong>File Type:</strong> ZIP file containing HTML, CSS, JS,
                  SVG, GIF, PNG, JPG/JPEG
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <strong>Assets:</strong> All images are downloaded and
                  included locally in the ZIP
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <strong>Fonts:</strong> Only Google web fonts are used
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600" />
                <div>
                  <strong>Optimization:</strong> HTML, CSS, and JS are minified;
                  images are compressed
                </div>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
                <div>
                  <strong>Excluded:</strong> Ad frames and mobile device frame
                  are removed
                </div>
              </div>
            </div>
          </div>

          {/* Unsupported Features Warning */}
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4" />
              <div>
                <div className="text-sm font-medium">Note</div>
                <div className="text-sm text-muted-foreground">
                  The exported H5 ad will not include: expandable ads, local
                  storage, multiple exits, or timers for environment actions.
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || isLoadingInfo}
          >
            {isExporting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ExportModal

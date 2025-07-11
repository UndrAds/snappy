import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Undo, Redo, Eye, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface EditorLayoutProps {
  children: ReactNode
  onSave?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onPreview?: () => void
  onExport?: () => void
  canUndo?: boolean
  canRedo?: boolean
}

export default function EditorLayout({
  children,
  onSave,
  onUndo,
  onRedo,
  onPreview,
  onExport,
  canUndo = false,
  canRedo = false,
}: EditorLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="flex h-14 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/create')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <div>
            <h1 className="text-lg font-semibold">Story Editor</h1>
            <p className="text-xs text-muted-foreground">
              Create engaging web stories
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
          >
            <Redo className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-gray-300"></div>
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4" />
            <span className="ml-2">Preview</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            <span className="ml-2">Export</span>
          </Button>
          <Button onClick={onSave} className="flex items-center space-x-2">
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

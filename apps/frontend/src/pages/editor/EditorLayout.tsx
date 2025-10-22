import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Eye, Code2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface EditorLayoutProps {
  children: ReactNode
  onSave?: () => void
  onPreview?: () => void
  onEmbed?: () => void
  storyTitle?: string
  isSaving?: boolean
}

export default function EditorLayout({
  children,
  onSave,
  onPreview,
  onEmbed,
  storyTitle,
  isSaving = false,
}: EditorLayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Toolbar */}
      <div className="flex h-14 items-center justify-between border-b bg-card px-4 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <div>
            <h1 className="text-lg font-semibold">
              {storyTitle ? `Editing: ${storyTitle}` : 'Story Editor'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {storyTitle
                ? 'Customize your story elements'
                : 'Create engaging web stories'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4" />
            <span className="ml-2">Preview</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={onEmbed}>
            <Code2 className="h-4 w-4" />
            <span className="ml-2">Embed</span>
          </Button>
          <Button
            onClick={onSave}
            className="flex items-center space-x-2"
            disabled={isSaving}
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? 'Saving...' : 'Save'}</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

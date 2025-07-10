import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Image, Video, FileText } from 'lucide-react'

export default function CreateSnapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Create New Snap</h2>
        <p className="text-muted-foreground">
          Create engaging web stories for your audience
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Story Details */}
        <Card>
          <CardHeader>
            <CardTitle>Story Details</CardTitle>
            <CardDescription>
              Basic information about your story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-medium">
                Story Title
              </label>
              <Input
                id="title"
                placeholder="Enter your story title"
                className="w-full"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium"
              >
                Description
              </label>
              <textarea
                id="description"
                placeholder="Brief description of your story"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label
                htmlFor="category"
                className="mb-2 block text-sm font-medium"
              >
                Category
              </label>
              <select
                id="category"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Select a category</option>
                <option value="news">News</option>
                <option value="entertainment">Entertainment</option>
                <option value="technology">Technology</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="sports">Sports</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Media Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Media Upload</CardTitle>
            <CardDescription>
              Add images and videos to your story
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="flex h-24 flex-col items-center justify-center"
              >
                <Image className="mb-2 h-6 w-6" />
                <span className="text-xs">Add Image</span>
              </Button>
              <Button
                variant="outline"
                className="flex h-24 flex-col items-center justify-center"
              >
                <Video className="mb-2 h-6 w-6" />
                <span className="text-xs">Add Video</span>
              </Button>
              <Button
                variant="outline"
                className="flex h-24 flex-col items-center justify-center"
              >
                <FileText className="mb-2 h-6 w-6" />
                <span className="text-xs">Add Text</span>
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              Drag and drop files here or click to browse
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Story Builder */}
      <Card>
        <CardHeader>
          <CardTitle>Story Builder</CardTitle>
          <CardDescription>Arrange your story slides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
            <Plus className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">Add Your First Slide</h3>
            <p className="mb-4 text-muted-foreground">
              Start building your story by adding slides with images, videos, or
              text
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Slide
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline">Save Draft</Button>
        <Button>Publish Story</Button>
      </div>
    </div>
  )
}

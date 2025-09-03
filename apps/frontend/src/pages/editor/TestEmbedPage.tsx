import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEmbedPage() {
  const [embedCode, setEmbedCode] = useState('')
  const [rendered, setRendered] = useState(false)
  const renderRef = useRef<HTMLDivElement>(null)

  const exampleCodes = {
    regular: `<div id="snappy-webstory-story-1-6d022295bbb1360a" style="width:300px;height:525px;"></div>
<script src="/webstory-embed.js" data-story-id="story-1-6d022295bbb1360a" data-api-url="http://localhost:3000" data-autoplay="false"></script>`,

    floaterRight: `<script src="/webstory-embed.js" 
  data-story-id="story-1-6d022295bbb1360a"
  data-api-url="http://localhost:3000" 
  data-floater="true"
  data-direction="right"
  data-trigger-scroll="50"
  data-position="bottom"
  data-size="medium"
  data-show-close="true"
  data-auto-hide="false"></script>`,

    floaterLeft: `<script src="/webstory-embed.js" 
  data-story-id="story-1-6d022295bbb1360a"
  data-api-url="http://localhost:3000" 
  data-floater="true"
  data-direction="left"
  data-trigger-scroll="30"
  data-position="top"
  data-size="small"
  data-show-close="true"
  data-auto-hide="true"
  data-auto-hide-delay="5000"></script>`,

    // Example for landscape story
    landscapeStory: `<div id="snappy-webstory-story-2-landscape" style="width:480px;height:270px;"></div>
<script src="/webstory-embed.js" data-story-id="story-2-landscape" data-api-url="http://localhost:3000" data-autoplay="false"></script>`,

    // Example for video player story
    videoPlayerStory: `<div id="snappy-webstory-story-3-video" style="width:320px;height:180px;"></div>
<script src="/webstory-embed.js" data-story-id="story-3-video" data-api-url="http://localhost:3000" data-autoplay="false"></script>`,
  }

  const handleRender = () => {
    if (renderRef.current) {
      renderRef.current.innerHTML = embedCode
      // Find and execute script tag (for demo only)
      const script = renderRef.current.querySelector('script')
      if (script) {
        const newScript = document.createElement('script')
        Array.from(script.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        )
        newScript.textContent = script.textContent
        renderRef.current.appendChild(newScript)
      }
      setRendered(true)
    }
  }

  const handleExampleSelect = (code: string) => {
    setEmbedCode(code)
  }

  return (
    <div className="mx-auto max-w-6xl py-10">
      <h1 className="mb-4 text-2xl font-bold">Test Web Story Embed</h1>
      <p className="mb-6 text-gray-600">
        Paste your embed code below to see how it will look on a real webpage.
        For floater embeds, scroll down in the preview area to trigger them.
        <strong>
          {' '}
          Note: Floater embeds now work as a hybrid approach - they first embed
          the story as a regular embed on the page, and then show a floating
          overlay when scrolling. Both respect the story's original format
          (portrait/landscape) and device frame (mobile/video player) settings.
          When you close the floater, only the overlay disappears - the regular
          embed remains visible on the page.
        </strong>
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Embed Code Input */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Embed Code</h2>
          <textarea
            className="mb-4 w-full rounded border p-2 font-mono text-xs"
            rows={12}
            placeholder="Paste your embed code here..."
            value={embedCode}
            onChange={(e) => setEmbedCode(e.target.value)}
          />
          <Button onClick={handleRender} disabled={!embedCode} className="mb-6">
            Preview
          </Button>
        </div>

        {/* Preview */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Preview</h2>
          <div
            className="min-h-[600px] overflow-y-auto rounded border bg-gray-50 p-4"
            ref={renderRef}
          >
            <div className="h-[800px] rounded bg-gradient-to-b from-blue-100 to-purple-100 p-4">
              <p className="mt-8 text-center text-gray-600">
                Scroll down in this preview area to test floater embeds
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded bg-white p-4 shadow">
                  <h3 className="font-semibold">Content Section 1</h3>
                  <p>This is some sample content to scroll through.</p>
                </div>
                <div className="rounded bg-white p-4 shadow">
                  <h3 className="font-semibold">Content Section 2</h3>
                  <p>More content to help with scrolling and testing.</p>
                </div>
                <div className="rounded bg-white p-4 shadow">
                  <h3 className="font-semibold">Content Section 3</h3>
                  <p>Even more content for testing scroll triggers.</p>
                </div>
              </div>
            </div>
          </div>
          {rendered && (
            <div className="mt-2 text-xs text-gray-500">
              If your story does not appear, check your embed code and script
              URL. For floater embeds, scroll down in the preview area to
              trigger them.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

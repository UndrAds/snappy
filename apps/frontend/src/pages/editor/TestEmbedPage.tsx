import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

// Resolve default embed script source based on environment
const DEFAULT_HEAD_SRC = import.meta.env.DEV
  ? 'http://localhost:5173/webstory-embed.js'
  : `${window.location.origin}/webstory-embed.js`

export default function TestEmbedPage() {
  const [headCode, setHeadCode] = useState(
    `<script src="${DEFAULT_HEAD_SRC}"></script>`
  )
  const [bodyCode, setBodyCode] = useState('')
  const [rendered, setRendered] = useState(false)
  const iframeContainerRef = useRef<HTMLDivElement>(null)

  const handleRender = () => {
    console.log('[TestEmbedPage] Preview clicked')

    if (!bodyCode.trim()) {
      alert('Please paste the body embed code (the <ins> element).')
      return
    }

    if (!iframeContainerRef.current) return

    // Clear previous iframe
    iframeContainerRef.current.innerHTML = ''

    // Create sandboxed iframe that simulates a third‑party site
    const iframe = document.createElement('iframe')
    iframe.style.width = '100%'
    iframe.style.minHeight = '600px'
    iframe.style.border = '0'
    iframe.title = 'Snappy Embed Preview'
    iframeContainerRef.current.appendChild(iframe)

    const doc = iframe.contentDocument || iframe.contentWindow?.document
    if (!doc) return

    // Fallback to local head script if none provided
    const injectedHead = headCode.trim()
      ? headCode
      : `<script src="${DEFAULT_HEAD_SRC}"></script>`

    const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Snappy Embed Iframe</title>
    ${injectedHead}
    <style>
      body { 
        margin: 0; 
        padding: 16px; 
        font-family: Arial, sans-serif; 
        min-height: 200vh;
        background: linear-gradient(to bottom, #f5f5f5, #e0e0e0);
      }
      .content-section {
        max-width: 800px;
        margin: 40px auto;
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .content-section h2 {
        color: #333;
        margin-bottom: 16px;
      }
      .content-section p {
        color: #666;
        line-height: 1.6;
        margin-bottom: 16px;
      }
    </style>
  </head>
  <body>
    <div class="content-section">
      <h2>Welcome to Our Website</h2>
      <p>This is a sample webpage to demonstrate the embed functionality. Scroll down to see the floater embed appear.</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    </div>
    ${bodyCode}
    <div class="content-section">
      <h2>About Our Services</h2>
      <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    </div>
    <div class="content-section">
      <h2>Contact Information</h2>
      <p>Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>
    </div>
    <div class="content-section">
      <h2>More Content</h2>
      <p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.</p>
    </div>
    <div class="content-section">
      <h2>Even More Content</h2>
      <p>Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.</p>
    </div>
  </body>
</html>`

    console.log('[TestEmbedPage] Writing iframe HTML with head + body embed')
    doc.open()
    doc.write(html)
    doc.close()

    setRendered(true)
  }

  return (
    <div className="mx-auto max-w-6xl py-10">
      <h1 className="mb-4 text-2xl font-bold">Test Web Story Embed</h1>
      <p className="mb-6 text-gray-600">
        Provide both the Head code (to include in the website's &lt;head&gt;)
        and the Body code (the &lt;ins&gt; element). We'll spin up a sandboxed
        iframe that simulates a new website and injects both, so the embed
        script can fetch and render your story.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Head Code</h2>
          <textarea
            className="mb-4 w-full rounded border p-2 font-mono text-xs"
            rows={6}
            placeholder='<script src="http://localhost:5173/webstory-embed.js"></script>'
            value={headCode}
            onChange={(e) => setHeadCode(e.target.value)}
          />

          <h2 className="mb-3 text-lg font-semibold">Body Embed Code</h2>
          <textarea
            className="mb-4 w-full rounded border p-2 font-mono text-xs"
            rows={10}
            placeholder='<ins id="snappy-webstory-XXXX" data-story-id="..." data-floater="false"></ins>'
            value={bodyCode}
            onChange={(e) => setBodyCode(e.target.value)}
          />

          <Button onClick={handleRender} className="mb-6">
            Preview
          </Button>
        </div>

        {/* Preview */}
        <div>
          <h2 className="mb-3 text-lg font-semibold">Preview</h2>
          <div className="min-h-[600px] overflow-hidden rounded border bg-gray-50">
            <div ref={iframeContainerRef} />
          </div>
          {rendered && (
            <div className="mt-2 text-xs text-gray-500">
              If your story does not appear, verify the Head script URL and the
              Body embed markup. For floater embeds, ensure scrolling in the
              iframe content triggers them.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

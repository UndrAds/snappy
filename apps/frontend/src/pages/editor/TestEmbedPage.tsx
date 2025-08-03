import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

export default function TestEmbedPage() {
  const [embedCode, setEmbedCode] = useState('')
  const [rendered, setRendered] = useState(false)
  const renderRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="mx-auto max-w-xl py-10">
      <h1 className="mb-4 text-2xl font-bold">Test Web Story Embed</h1>
      <textarea
        className="mb-4 w-full rounded border p-2 font-mono text-xs"
        rows={5}
        placeholder="Paste your embed code here..."
        value={embedCode}
        onChange={(e) => setEmbedCode(e.target.value)}
      />
      <Button onClick={handleRender} disabled={!embedCode} className="mb-6">
        Insert
      </Button>
      <div
        className="min-h-[400px] rounded border bg-gray-50 p-4"
        ref={renderRef}
      ></div>
      {rendered && (
        <div className="mt-2 text-xs text-gray-500">
          If your story does not appear, check your embed code and script URL.
        </div>
      )}
    </div>
  )
}

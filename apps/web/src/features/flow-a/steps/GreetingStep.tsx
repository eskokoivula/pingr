import { useRef, useEffect, useCallback } from 'react'
import { Toggle } from '../../../components/ui/Toggle'

interface Props {
  message: string
  onMessageChange: (v: string) => void
  sendBlurb: boolean
  onSendBlurbChange: (v: boolean) => void
  blurb: string | null
}

// Sanitize HTML: only allow <a>, <br>, text
function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  function clean(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent || ''
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      const children = Array.from(el.childNodes).map(clean).join('')
      if (tag === 'a') {
        const href = el.getAttribute('href') || ''
        if (href) return `<a href="${href}" target="_blank" rel="noopener noreferrer">${children}</a>`
        return children
      }
      if (tag === 'br') return '<br>'
      if (tag === 'div' || tag === 'p') return children + '<br>'
      return children
    }
    return ''
  }
  return Array.from(div.childNodes).map(clean).join('')
    .replace(/<br>$/, '')
    .replace(/(<br>){3,}/g, '<br><br>')
}

export function GreetingStep({ message, onMessageChange, sendBlurb, onSendBlurbChange, blurb }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = message || ''
      isInitialized.current = true
    }
  }, [message])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    const html = sanitizeHtml(editorRef.current.innerHTML)
    onMessageChange(html)
  }, [onMessageChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')
    if (html) {
      document.execCommand('insertHTML', false, sanitizeHtml(html))
    } else {
      document.execCommand('insertText', false, text)
    }
  }, [])

  return (
    <div>
      <h2 className="text-[22px] font-bold mb-1">Greeting message</h2>
      <p className="text-pingr-secondary text-[15px] mb-6">
        This will be sent to the contact via Telegram as a personal message from you
      </p>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="w-full min-h-[200px] rounded-[14px] bg-white/[0.06] border-[1.5px] border-white/[0.08] px-4 py-4 text-[16px] leading-[1.6] text-pingr-text outline-none focus:border-white/20 transition-colors [&_a]:text-pingr-link [&_a]:underline"
      />

      {blurb && (
        <div className="mt-5">
          <Toggle
            checked={sendBlurb}
            onChange={onSendBlurbChange}
            label="Send blurb"
            description="Attach your blurb as a separate message"
          />

          {sendBlurb && (
            <div className="mt-3 bg-white/[0.04] rounded-[12px] p-4 border border-white/[0.06]">
              <p className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">Blurb preview</p>
              <div
                className="text-[14px] leading-[1.5] text-pingr-secondary [&_a]:text-pingr-link [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: blurb }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

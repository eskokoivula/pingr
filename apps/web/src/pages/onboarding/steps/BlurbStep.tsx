import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
}

// Sanitize HTML: only allow <a> tags, <br>, and text
function sanitizeHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html

  function clean(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || ''
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      const tag = el.tagName.toLowerCase()
      const children = Array.from(el.childNodes).map(clean).join('')

      if (tag === 'a') {
        const href = el.getAttribute('href') || ''
        if (href) {
          return `<a href="${href}" target="_blank" rel="noopener noreferrer">${children}</a>`
        }
        return children
      }
      if (tag === 'br') return '<br>'
      if (tag === 'div' || tag === 'p') return children + '<br>'
      return children
    }
    return ''
  }

  return Array.from(div.childNodes).map(clean).join('')
    .replace(/<br>$/, '')  // remove trailing br
    .replace(/(<br>){3,}/g, '<br><br>')  // max 2 consecutive line breaks
}

export function BlurbStep({ value, onChange }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const [showToolbar, setShowToolbar] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const urlInputRef = useRef<HTMLInputElement>(null)
  const savedSelection = useRef<Range | null>(null)
  const isInitialized = useRef(false)

  // Set initial content once
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || ''
      isInitialized.current = true
    }
  }, [value])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    const html = sanitizeHtml(editorRef.current.innerHTML)
    onChange(html)
  }, [onChange])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    // Try to get HTML first (preserves links), fall back to plain text
    const html = e.clipboardData.getData('text/html')
    const text = e.clipboardData.getData('text/plain')

    if (html) {
      const clean = sanitizeHtml(html)
      document.execCommand('insertHTML', false, clean)
    } else {
      document.execCommand('insertText', false, text)
    }
  }, [])

  const saveSelection = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange()
    }
  }

  const restoreSelection = () => {
    const sel = window.getSelection()
    if (sel && savedSelection.current) {
      sel.removeAllRanges()
      sel.addRange(savedSelection.current)
    }
  }

  const checkSelection = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) {
      setTimeout(() => {
        if (!toolbarRef.current?.contains(document.activeElement) && !showUrlInput) {
          setShowToolbar(false)
        }
      }, 150)
      return
    }
    saveSelection()
    setShowToolbar(true)
  }, [showUrlInput])

  useEffect(() => {
    document.addEventListener('selectionchange', checkSelection)
    return () => document.removeEventListener('selectionchange', checkSelection)
  }, [checkSelection])

  const handleLinkClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    saveSelection()
    setShowUrlInput(true)
    setLinkUrl('')
    setTimeout(() => urlInputRef.current?.focus(), 50)
  }

  const applyLink = () => {
    if (!linkUrl.trim()) return
    const url = linkUrl.startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`

    restoreSelection()
    document.execCommand('createLink', false, url)

    // Add target="_blank" to the new link
    if (editorRef.current) {
      editorRef.current.querySelectorAll('a').forEach((a) => {
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener noreferrer')
      })
    }

    handleInput()
    setShowToolbar(false)
    setShowUrlInput(false)
    setLinkUrl('')
  }

  const cancelLink = () => {
    setShowUrlInput(false)
    setShowToolbar(false)
  }

  return (
    <div>
      <h2 className="text-[22px] font-bold mb-2">Your blurb</h2>
      <p className="text-pingr-secondary text-[15px] mb-1">Sent in every greeting message.</p>
      <p className="text-pingr-secondary/60 text-[13px] mb-5">Select text to turn it into a link.</p>

      <div className="relative">
        {/* Floating link toolbar */}
        {showToolbar && !showUrlInput && (
          <div
            ref={toolbarRef}
            className="absolute -top-11 left-1/2 -translate-x-1/2 z-10 bg-[#2A2A2D] rounded-[10px] shadow-lg border border-white/10 flex items-center px-1 py-1"
          >
            <button
              onMouseDown={handleLinkClick}
              onTouchStart={handleLinkClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] hover:bg-white/10 active:bg-white/10 text-pingr-link"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
              <span className="text-[13px] font-medium">Link</span>
            </button>
          </div>
        )}

        {/* URL input bar */}
        {showUrlInput && (
          <div className="absolute -top-12 left-0 right-0 z-10 bg-[#2A2A2D] rounded-[10px] shadow-lg border border-white/10 flex items-center px-2 py-1.5 gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B8B8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            <input
              ref={urlInputRef}
              className="flex-1 bg-transparent text-[14px] text-pingr-text placeholder:text-pingr-secondary/50 outline-none min-w-0"
              placeholder="Paste URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') applyLink() }}
            />
            <button
              onClick={applyLink}
              disabled={!linkUrl.trim()}
              className="text-pingr-link text-[13px] font-semibold disabled:opacity-30 shrink-0"
            >
              Done
            </button>
            <button onClick={cancelLink} className="text-pingr-secondary text-[16px] shrink-0 px-0.5">✕</button>
          </div>
        )}

        {/* ContentEditable editor */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          data-placeholder="e.g. Building the future of event networking"
          className="w-full min-h-[180px] rounded-[14px] bg-white/[0.06] border-[1.5px] border-white/[0.08] px-4 py-4 text-[18px] leading-[1.6] text-pingr-text outline-none focus:border-white/20 transition-colors empty:before:content-[attr(data-placeholder)] empty:before:text-pingr-secondary/50 [&_a]:text-pingr-link [&_a]:underline"
        />
      </div>
    </div>
  )
}

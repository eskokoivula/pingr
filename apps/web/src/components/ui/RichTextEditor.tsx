import { useRef, useEffect, useCallback } from 'react'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  label?: string
  rows?: number
}

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

export function RichTextEditor({ value, onChange, placeholder, className = '', label, rows = 3 }: Props) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInitialized = useRef(false)

  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || ''
      isInitialized.current = true
    }
  }, [value])

  const handleInput = useCallback(() => {
    if (!editorRef.current) return
    onChange(sanitizeHtml(editorRef.current.innerHTML))
  }, [onChange])

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

  const minHeight = rows * 28

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#52525B] mb-2">
          {label}
        </label>
      )}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={`w-full rounded-[12px] bg-white/[0.06] border-[1.5px] border-white/[0.08] px-4 py-[14px] text-[15px] text-pingr-text outline-none focus:border-white/20 transition-colors leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-pingr-secondary/50 [&_a]:text-pingr-link [&_a]:underline ${className}`}
      />
    </div>
  )
}

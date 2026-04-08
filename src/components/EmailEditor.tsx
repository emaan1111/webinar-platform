'use client'

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

// Custom styles for font size picker and fonts
const customStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
  
  .ql-font-Open-Sans {
    font-family: 'Open Sans', sans-serif;
  }
  .ql-snow .ql-picker.ql-size .ql-picker-label::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item::before {
    content: attr(data-value) !important;
  }
  .ql-snow .ql-picker.ql-size .ql-picker-label[data-value=""]::before,
  .ql-snow .ql-picker.ql-size .ql-picker-item[data-value=""]::before {
    content: 'Size' !important;
  }
  .ql-snow .ql-picker.ql-font .ql-picker-label::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item::before {
    content: attr(data-value) !important;
  }
  .ql-snow .ql-picker.ql-font .ql-picker-label[data-value=""]::before,
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value=""]::before {
    content: 'Font' !important;
  }
  .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="Open Sans"]::before {
    font-family: 'Open Sans', sans-serif;
  }
  .ql-snow .ql-picker.ql-size {
    width: 70px;
  }
  .ql-snow .ql-picker.ql-font {
    width: 110px;
  }
`

interface EmailEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function EmailEditor({ value, onChange, placeholder }: EmailEditorProps) {
  const quillRef = useRef<ReactQuill>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const imageHandler = useCallback(() => {
    const url = prompt('Enter the image URL:')
    if (url) {
      const editor = quillRef.current?.getEditor()
      if (editor) {
        const range = editor.getSelection(true)
        editor.insertEmbed(range.index, 'image', url)
        editor.setSelection(range.index + 1)
      }
    }
  }, [])

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ font: ['', 'serif', 'monospace', 'Open Sans'] }],
        [{ size: ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'] }],
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler])

  // Register custom font sizes and fonts with Quill
  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      const Quill = require('react-quill-new').Quill
      if (Quill) {
        const Size = Quill.import('attributors/style/size')
        Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']
        Quill.register(Size, true)
        
        const Font = Quill.import('attributors/class/font')
        Font.whitelist = ['serif', 'monospace', 'Open Sans']
        Quill.register(Font, true)
      }
    }
  }, [mounted])

  // Insert text at the current cursor position
  const insertText = useCallback((text: string) => {
    const editor = quillRef.current?.getEditor()
    if (editor) {
      const range = editor.getSelection(true)
      editor.insertText(range.index, text)
      editor.setSelection(range.index + text.length)
    }
  }, [])

  // Expose insertText via a data attribute on the container
  useEffect(() => {
    if (mounted) {
      // Store the insert function on window so parent can call it
      ;(window as any).__emailEditorInsert = insertText
    }
    return () => {
      delete (window as any).__emailEditorInsert
    }
  }, [mounted, insertText])

  if (!mounted) {
    return (
      <div className="h-[300px] bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-400">
        Loading editor...
      </div>
    )
  }

  return (
    <>
      <style>{customStyles}</style>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder || 'Compose your email...'}
      />
    </>
  )
}

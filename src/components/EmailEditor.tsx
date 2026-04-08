'use client'

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

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
    <ReactQuill
      ref={quillRef}
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      placeholder={placeholder || 'Compose your email...'}
    />
  )
}

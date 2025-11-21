'use client'

import { useEffect, useRef, useState } from 'react'

interface VisualHTMLEditorProps {
  html: string
  onChange: (html: string) => void
}

export default function VisualHTMLEditor({ html, onChange }: VisualHTMLEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null)
  const [isEditingText, setIsEditingText] = useState(false)

  useEffect(() => {
    if (!iframeRef.current) return

    const iframe = iframeRef.current
    const doc = iframe.contentDocument || iframe.contentWindow?.document

    if (!doc) return

    // Write HTML to iframe
    doc.open()
    doc.write(html || '<html><body><p style="padding: 20px; text-align: center; color: #666;">Your template preview will appear here.</p></body></html>')
    doc.close()

    // Add editing styles
    const style = doc.createElement('style')
    style.textContent = `
      [data-editable]:hover {
        outline: 2px dashed #3b82f6 !important;
        outline-offset: 2px;
        cursor: pointer;
        position: relative;
      }
      
      [data-editable].selected {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px;
        position: relative;
      }
      
      [data-editable][contenteditable="true"] {
        outline: 3px solid #10b981 !important;
        outline-offset: 2px;
        background-color: rgba(16, 185, 129, 0.05);
      }
      
      .edit-toolbar {
        position: absolute;
        top: -40px;
        left: 0;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 4px;
        display: flex;
        gap: 4px;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        z-index: 10000;
      }
      
      .edit-toolbar button {
        padding: 4px 8px;
        border: none;
        background: white;
        cursor: pointer;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
      }
      
      .edit-toolbar button:hover {
        background: #f3f4f6;
      }
      
      .edit-toolbar button.edit-btn {
        color: #3b82f6;
      }
      
      .edit-toolbar button.delete-btn {
        color: #ef4444;
      }
      
      .edit-toolbar button.save-btn {
        background: #10b981;
        color: white;
      }
      
      .edit-toolbar button.save-btn:hover {
        background: #059669;
      }
      
      .edit-toolbar button.cancel-btn {
        background: #6b7280;
        color: white;
      }
      
      .edit-toolbar button.cancel-btn:hover {
        background: #4b5563;
      }
      
      img[data-editable]:hover::after {
        content: '🖼️ Click to delete image';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
      }
    `
    doc.head.appendChild(style)

    // Make elements editable
    const makeElementsEditable = () => {
      // Text elements
      const textElements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, a, button, label')
      textElements.forEach(el => {
        if (el instanceof HTMLElement && !el.querySelector('img, iframe, video')) {
          el.setAttribute('data-editable', 'true')
        }
      })

      // Images
      const images = doc.querySelectorAll('img')
      images.forEach(img => {
        if (img instanceof HTMLElement) {
          img.setAttribute('data-editable', 'true')
          img.setAttribute('data-type', 'image')
        }
      })

      // Sections and containers
      const containers = doc.querySelectorAll('section, article, header, footer, nav')
      containers.forEach(el => {
        if (el instanceof HTMLElement) {
          el.setAttribute('data-editable', 'true')
          el.setAttribute('data-type', 'container')
        }
      })
    }

    makeElementsEditable()

    // Add click handlers
    const handleElementClick = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const target = e.target as HTMLElement
      const editable = target.closest('[data-editable]') as HTMLElement

      if (!editable) return

      // Remove previous selection
      doc.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))

      // Select new element
      editable.classList.add('selected')
      setSelectedElement(editable)

      // Show toolbar
      showToolbar(editable, doc)
    }

    const showToolbar = (element: HTMLElement, document: Document) => {
      // Remove existing toolbar
      document.querySelectorAll('.edit-toolbar').forEach(t => t.remove())

      const toolbar = document.createElement('div')
      toolbar.className = 'edit-toolbar'

      const elementType = element.getAttribute('data-type')

      if (elementType === 'image') {
        // Image-specific toolbar
        const deleteBtn = document.createElement('button')
        deleteBtn.className = 'delete-btn'
        deleteBtn.textContent = '🗑️ Delete Image'
        deleteBtn.onclick = () => {
          if (confirm('Delete this image?')) {
            element.remove()
            updateHTML(document)
          }
        }
        toolbar.appendChild(deleteBtn)

        const changeBtn = document.createElement('button')
        changeBtn.className = 'edit-btn'
        changeBtn.textContent = '🖼️ Change URL'
        changeBtn.onclick = () => {
          const currentSrc = element.getAttribute('src') || ''
          const newSrc = prompt('Enter new image URL:', currentSrc)
          if (newSrc !== null) {
            element.setAttribute('src', newSrc)
            updateHTML(document)
          }
        }
        toolbar.appendChild(changeBtn)
      } else if (elementType === 'container') {
        // Container-specific toolbar
        const deleteBtn = document.createElement('button')
        deleteBtn.className = 'delete-btn'
        deleteBtn.textContent = '🗑️ Delete Section'
        deleteBtn.onclick = () => {
          if (confirm('Delete this entire section?')) {
            element.remove()
            updateHTML(document)
          }
        }
        toolbar.appendChild(deleteBtn)
      } else {
        // Text element toolbar
        const editBtn = document.createElement('button')
        editBtn.className = 'edit-btn'
        editBtn.textContent = '✏️ Edit Text'
        editBtn.onclick = () => {
          element.contentEditable = 'true'
          element.focus()
          setIsEditingText(true)
          toolbar.remove()
          showEditingToolbar(element, document)
        }
        toolbar.appendChild(editBtn)

        const deleteBtn = document.createElement('button')
        deleteBtn.className = 'delete-btn'
        deleteBtn.textContent = '🗑️ Delete'
        deleteBtn.onclick = () => {
          if (confirm('Delete this element?')) {
            element.remove()
            updateHTML(document)
          }
        }
        toolbar.appendChild(deleteBtn)
      }

      element.style.position = 'relative'
      element.appendChild(toolbar)
    }

    const showEditingToolbar = (element: HTMLElement, document: Document) => {
      const toolbar = document.createElement('div')
      toolbar.className = 'edit-toolbar'

      const saveBtn = document.createElement('button')
      saveBtn.className = 'save-btn'
      saveBtn.textContent = '✓ Save'
      saveBtn.onclick = () => {
        element.contentEditable = 'false'
        element.classList.remove('selected')
        toolbar.remove()
        updateHTML(document)
        setIsEditingText(false)
      }
      toolbar.appendChild(saveBtn)

      const cancelBtn = document.createElement('button')
      cancelBtn.className = 'cancel-btn'
      cancelBtn.textContent = '✕ Cancel'
      cancelBtn.onclick = () => {
        element.contentEditable = 'false'
        element.classList.remove('selected')
        toolbar.remove()
        // Reload to cancel changes
        if (iframeRef.current) {
          const iframe = iframeRef.current
          const doc = iframe.contentDocument || iframe.contentWindow?.document
          if (doc) {
            doc.open()
            doc.write(html)
            doc.close()
            makeElementsEditable()
          }
        }
        setIsEditingText(false)
      }
      toolbar.appendChild(cancelBtn)

      element.appendChild(toolbar)
    }

    const updateHTML = (document: Document) => {
      // Remove toolbars and selection classes before getting HTML
      document.querySelectorAll('.edit-toolbar').forEach(t => t.remove())
      document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'))
      document.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'))

      const newHTML = document.documentElement.outerHTML
      onChange(newHTML)
    }

    // Add event listeners
    doc.addEventListener('click', handleElementClick)

    // Cleanup
    return () => {
      doc.removeEventListener('click', handleElementClick)
    }
  }, [html, onChange])

  return (
    <div className="relative">
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-medium text-blue-900 mb-1">🎨 Visual Editor - Click to Edit</p>
        <ul className="text-blue-800 space-y-1 ml-4 list-disc text-xs">
          <li><strong>Click any text</strong> to see edit options → Edit inline or delete element</li>
          <li><strong>Click images</strong> to delete or change URL</li>
          <li><strong>Click sections</strong> (header/footer) to delete entire section</li>
          <li>Changes are saved automatically when you click "Save"</li>
        </ul>
      </div>
      
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white" style={{ height: '600px' }}>
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0"
          title="Visual Editor"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>

      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
        <p className="text-green-900">
          💡 <strong>Pro Tip:</strong> For advanced changes (layouts, colors, new elements), switch to Code Editor.
          Visual editor is perfect for quick text edits and removing elements!
        </p>
      </div>
    </div>
  )
}

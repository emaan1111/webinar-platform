'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Copy, Search, Image as ImageIcon, Trash2, Edit2, Check } from 'lucide-react'

interface Image {
  id: string
  filename: string
  originalName: string
  url: string
  size: number
  mimeType: string
  width?: number
  height?: number
  tags?: string
  description?: string
  createdAt: string
}

export default function ImagesPage() {
  const router = useRouter()
  const [images, setImages] = useState<Image[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState({ tags: '', description: '' })
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    fetchImages()
  }, [])

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/images')
      if (response.ok) {
        const data = await response.json()
        setImages(data)
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileList = Array.from(files)
    setUploading(true)
    setUploadProgress({ current: 0, total: fileList.length })

    const errors: string[] = []

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      setUploadProgress({ current: i + 1, total: fileList.length })

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/images', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          errors.push(`${file.name}: ${error.error}`)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        errors.push(`${file.name}: Failed to upload`)
      }
    }

    await fetchImages()
    setUploading(false)
    setUploadProgress(null)

    if (errors.length > 0) {
      alert(`Some images failed to upload:\n\n${errors.join('\n')}`)
    }
  }

  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return

    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setImages(images.filter(img => img.id !== id))
      } else {
        alert('Failed to delete image')
      }
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Failed to delete image')
    }
  }

  const handleEdit = (image: Image) => {
    setEditingId(image.id)
    setEditData({
      tags: image.tags || '',
      description: image.description || ''
    })
  }

  const handleSaveEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        await fetchImages()
        setEditingId(null)
      } else {
        alert('Failed to update image')
      }
    } catch (error) {
      console.error('Error updating image:', error)
      alert('Failed to update image')
    }
  }

  const copyToClipboard = (url: string, id: string) => {
    const fullUrl = `${window.location.origin}${url}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files)
    }
  }

  const filteredImages = images.filter(img =>
    img.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (img.tags && img.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (img.description && img.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Library</h1>
          <p className="text-gray-600">Upload and manage images for your webinar pages</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Image</h2>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your images here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports: JPG, PNG, GIF, WebP, SVG (Max 10MB each). You can select multiple at once.
            </p>
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleUpload(e.target.files)
                e.target.value = ''
              }}
              disabled={uploading}
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {uploadProgress && uploadProgress.total > 1
                    ? `Uploading ${uploadProgress.current} of ${uploadProgress.total}...`
                    : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </>
              )}
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search images by name, tags, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Images Grid */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Your Images ({filteredImages.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading images...</p>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchQuery ? 'No images found matching your search' : 'No images uploaded yet'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image) => (
                <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Image Preview */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.originalName}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Image Details */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate mb-2" title={image.originalName}>
                      {image.originalName}
                    </h3>

                    {editingId === image.id ? (
                      <div className="space-y-2 mb-3">
                        <input
                          type="text"
                          placeholder="Tags (comma-separated)"
                          value={editData.tags}
                          onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <textarea
                          placeholder="Description"
                          value={editData.description}
                          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          rows={2}
                        />
                        <button
                          onClick={() => handleSaveEdit(image.id)}
                          className="w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center justify-center gap-1"
                        >
                          <Check className="h-4 w-4" />
                          Save
                        </button>
                      </div>
                    ) : (
                      <>
                        {image.tags && (
                          <p className="text-xs text-gray-600 mb-1">
                            <span className="font-medium">Tags:</span> {image.tags}
                          </p>
                        )}
                        {image.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {image.description}
                          </p>
                        )}
                      </>
                    )}

                    <div className="text-xs text-gray-500 space-y-1 mb-3">
                      <p>Size: {formatFileSize(image.size)}</p>
                      {image.width && image.height && (
                        <p>Dimensions: {image.width} × {image.height}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(image.url, image.id)}
                        className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 flex items-center justify-center gap-1"
                        title="Copy URL"
                      >
                        {copiedId === image.id ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy URL
                          </>
                        )}
                      </button>
                      
                      {editingId === image.id ? (
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                          title="Cancel"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEdit(image)}
                          className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                          title="Edit metadata"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleDelete(image.id, image.originalName)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

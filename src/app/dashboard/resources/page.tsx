'use client'

import React, { useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import {
  Upload,
  FileText,
  File,
  Image,
  Video,
  Music,
  Archive,
  Download,
  Trash2,
  Edit,
  Eye,
  Lock,
  Unlock,
  Plus
} from 'lucide-react'

// Mock resources data
const mockResources = [
  {
    id: '1',
    webinarId: 'webinar1',
    webinarTitle: 'Advanced React Patterns',
    title: 'Course Slides PDF',
    description: 'Complete presentation slides from the webinar',
    fileName: 'react-patterns-slides.pdf',
    fileType: 'pdf',
    fileSize: 2048576, // bytes
    downloadCount: 45,
    isPublic: false,
    uploadedAt: '2025-10-20T10:00:00',
  },
  {
    id: '2',
    webinarId: 'webinar1',
    webinarTitle: 'Advanced React Patterns',
    title: 'Code Examples',
    description: 'ZIP file containing all code examples',
    fileName: 'code-examples.zip',
    fileType: 'zip',
    fileSize: 5242880,
    downloadCount: 78,
    isPublic: true,
    uploadedAt: '2025-10-20T11:00:00',
  },
  {
    id: '3',
    webinarId: 'webinar1',
    webinarTitle: 'Advanced React Patterns',
    title: 'Resource Guide',
    description: 'Additional learning resources and links',
    fileName: 'resource-guide.docx',
    fileType: 'docx',
    fileSize: 102400,
    downloadCount: 32,
    isPublic: false,
    uploadedAt: '2025-10-20T12:00:00',
  },
]

export default function ResourcesPage() {
  const [resources, setResources] = useState(mockResources)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const [formData, setFormData] = useState({
    webinarId: '',
    title: '',
    description: '',
    isPublic: false,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />
      case 'zip':
      case 'rar':
        return <Archive className="w-8 h-8 text-yellow-500" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-8 h-8 text-blue-500" />
      case 'mp4':
      case 'mov':
      case 'avi':
        return <Video className="w-8 h-8 text-purple-500" />
      case 'mp3':
      case 'wav':
        return <Music className="w-8 h-8 text-green-500" />
      default:
        return <File className="w-8 h-8 text-gray-500" />
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFileUpload(files)
  }

  const handleFileUpload = (files: File[]) => {
    // In a real app, this would upload to a server
    files.forEach(file => {
      const newResource = {
        id: Date.now().toString(),
        webinarId: formData.webinarId || 'webinar1',
        webinarTitle: 'Advanced React Patterns',
        title: formData.title || file.name,
        description: formData.description,
        fileName: file.name,
        fileType: file.name.split('.').pop() || 'file',
        fileSize: file.size,
        downloadCount: 0,
        isPublic: formData.isPublic,
        uploadedAt: new Date().toISOString(),
      }
      setResources([...resources, newResource])
    })
    
    setShowForm(false)
    setFormData({
      webinarId: '',
      title: '',
      description: '',
      isPublic: false,
    })
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFileUpload(files)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      setResources(resources.filter(r => r.id !== id))
    }
  }

  const handleTogglePublic = (id: string) => {
    setResources(resources.map(r =>
      r.id === id ? { ...r, isPublic: !r.isPublic } : r
    ))
  }

  const handleEdit = (resource: typeof mockResources[0]) => {
    setFormData({
      webinarId: resource.webinarId,
      title: resource.title,
      description: resource.description,
      isPublic: resource.isPublic,
    })
    setEditingId(resource.id)
    setShowForm(true)
  }

  const totalSize = resources.reduce((sum, r) => sum + r.fileSize, 0)
  const totalDownloads = resources.reduce((sum, r) => sum + r.downloadCount, 0)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bonus Resources</h1>
            <p className="mt-1 text-sm text-gray-500">
              Upload and manage downloadable resources for your webinars
            </p>
          </div>
          <Button
            onClick={() => {
              setShowForm(true)
              setEditingId(null)
              setFormData({
                webinarId: '',
                title: '',
                description: '',
                isPublic: false,
              })
            }}
            className="inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Resource
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Total Resources</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{resources.length}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Total Downloads</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">{totalDownloads}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <h3 className="text-sm font-medium text-gray-600">Storage Used</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">{formatFileSize(totalSize)}</p>
            </CardBody>
          </Card>
        </div>

        {/* Upload Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Resource' : 'Add New Resource'}
              </h2>
            </CardHeader>
            <CardBody>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Webinar
                  </label>
                  <select
                    value={formData.webinarId}
                    onChange={(e) => setFormData({ ...formData, webinarId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a webinar</option>
                    <option value="webinar1">Advanced React Patterns</option>
                    <option value="webinar2">Next.js Deep Dive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resource Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Course Slides PDF"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe this resource..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-700">
                    Make this resource publicly accessible (without registration)
                  </label>
                </div>

                {/* Drag & Drop Upload */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drag and drop files here
                  </p>
                  <p className="text-sm text-gray-500 mb-4">or</p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="secondary">
                      Browse Files
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileInput}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-4">
                    Supports: PDF, DOCX, ZIP, Images, Videos (Max 50MB each)
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Resources List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {resources.map((resource) => (
            <Card key={resource.id}>
              <CardBody>
                <div className="flex items-start gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    {getFileIcon(resource.fileType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">{resource.title}</h3>
                        <p className="text-sm text-gray-500">{resource.webinarTitle}</p>
                      </div>
                      <button
                        onClick={() => handleTogglePublic(resource.id)}
                        className={`p-2 rounded-lg ${
                          resource.isPublic
                            ? 'bg-green-100 text-green-600'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {resource.isPublic ? (
                          <Unlock className="w-4 h-4" />
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {resource.description && (
                      <p className="text-sm text-gray-700 mb-3">{resource.description}</p>
                    )}

                    {/* File Details */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>{resource.fileName}</span>
                      <span>•</span>
                      <span>{formatFileSize(resource.fileSize)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {resource.downloadCount} downloads
                      </span>
                    </div>

                    {/* Access Badge */}
                    <div className="mb-3">
                      {resource.isPublic ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          Public Access
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Attendees Only
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleEdit(resource)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(resource.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {resources.length === 0 && !showForm && (
          <Card>
            <CardBody>
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload your first bonus resource for webinar attendees
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Resource
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

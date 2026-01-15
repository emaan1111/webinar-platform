
'use client'

import { createForm } from '@/app/actions/forms'
import { useState } from 'react'

export default function NewFormPage() {
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    try {
      await createForm(formData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Form</h1>
      
      <form action={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Form Title</label>
            <input 
              name="title" 
              type="text" 
              required 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. Contact Us"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug</label>
            <div className="flex items-center">
              <span className="bg-gray-50 border border-r-0 rounded-l-lg px-3 py-2 text-gray-500 text-sm">
                /f/
              </span>
              <input 
                name="slug" 
                type="text" 
                required 
                className="flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="contact-us"
                onChange={(e) => {
                  // Simple slugify
                  e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea 
              name="description" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>

          <button 
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            Create Form
          </button>
        </div>
      </form>
    </div>
  )
}

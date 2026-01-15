'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, GripVertical, Save, Check, ArrowUp, ArrowDown, Bot } from 'lucide-react'
import { addField, updateField, deleteField, updateFormSettings, reorderField } from '@/app/actions/forms'

interface EditorProps {
  form: any
}

export default function FormEditor({ form }: EditorProps) {
  const [activeTab, setActiveTab] = useState<'build' | 'settings' | 'submissions' | 'ai'>('build')
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState<string | null>(null)
  
  // Field Types
  const fieldTypes = [
    { type: 'text', label: 'Short Text', icon: 'Aa' },
    { type: 'textarea', label: 'Long Text', icon: '¶' },
    { type: 'email', label: 'Email', icon: '@' },
    { type: 'number', label: 'Number', icon: '#' },
    { type: 'select', label: 'Dropdown', icon: '▼' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑' },
  ]

  const handleAddField = async (type: string) => {
    setSaving(true)
    await addField(form.id, type)
    setSaving(false)
  }

  const handleUpdateField = async (id: string, updates: any) => {
    // Optimistic update locally? For now, simple wait
    await updateField(id, updates)
  }

  const handleDeleteField = async (id: string) => {
    if(!confirm('Delete this field?')) return
    await deleteField(id, form.id)
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    setReordering(id)
    await reorderField(form.id, id, direction)
    setReordering(null)
  }
  
  const handleUpdateSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    await updateFormSettings(form.id, {
      title: formData.get('title'),
      submitText: formData.get('submitText'),
      successMsg: formData.get('successMsg'),
      description: formData.get('description'),
      primaryColor: formData.get('primaryColor'),
    })
    setSaving(false)
  }

  const handleUpdateAISettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)
    const formData = new FormData(e.currentTarget)
    await updateFormSettings(form.id, {
      aiAssessmentEnabled: formData.get('aiAssessmentEnabled') === 'on',
      aiPrompt: formData.get('aiPrompt'),
      aiApproveMsg: formData.get('aiApproveMsg'),
      aiRejectMsg: formData.get('aiRejectMsg'),
      aiReviewMsg: formData.get('aiReviewMsg'),
      redirectUrl: formData.get('redirectUrl')
    })
    setSaving(false)
  }

  if (activeTab === 'ai') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
        <div className="mb-6 border-b pb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bot className="text-purple-600" />
            AI Form Assessment
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Enable AI to automatically evaluate submissions and return an instant decision.
          </p>
        </div>

        <form onSubmit={handleUpdateAISettings} className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
            <input 
              type="checkbox" 
              name="aiAssessmentEnabled" 
              id="aiCheck"
              defaultChecked={form.aiAssessmentEnabled}
              className="h-5 w-5 text-purple-600 rounded"
            />
            <label htmlFor="aiCheck" className="font-medium text-gray-900 cursor-pointer">
              Enable AI Assessment
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Assessment Instructions (Prompt)</label>
            <textarea 
              name="aiPrompt" 
              defaultValue={form.aiPrompt || ''} 
              rows={4}
              placeholder="e.g. Reject if age is under 18. Ensure the user provides a valid reason for applying."
              className="w-full border rounded p-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">The AI will review the submission based on these rules.</p>
          </div>

          <div className="grid gap-4 pt-4 border-top">
            <h3 className="font-medium text-gray-900">Feedback Messages</h3>
            
            <div>
              <label className="block text-xs font-medium text-green-700 mb-1">Approval Message</label>
              <input 
                name="aiApproveMsg" 
                defaultValue={form.aiApproveMsg || "Congratulations! Your application has been approved."} 
                className="w-full border border-green-200 bg-green-50 rounded p-2 text-sm" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-blue-700 mb-1">Redirect URL on Approval</label>
              <input 
                name="redirectUrl" 
                type="url"
                placeholder="https://example.com/register"
                defaultValue={form.redirectUrl || ''} 
                className="w-full border border-blue-200 bg-blue-50 rounded p-2 text-sm" 
              />
              <p className="text-[10px] text-gray-500 mt-1">If set, approved users will see a "Proceed to Register" button linking here.</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-red-700 mb-1">Rejection Message</label>
              <input 
                name="aiRejectMsg" 
                defaultValue={form.aiRejectMsg || "Sorry, your application does not meet the criteria."} 
                className="w-full border border-red-200 bg-red-50 rounded p-2 text-sm" 
              />
            </div>

            <div>
               <label className="block text-xs font-medium text-yellow-700 mb-1">Review/Uncertain Message</label>
               <input 
                 name="aiReviewMsg" 
                 defaultValue={form.aiReviewMsg || "Your application is under review."} 
                 className="w-full border border-yellow-200 bg-yellow-50 rounded p-2 text-sm" 
               />
            </div>
          </div>

          <button disabled={saving} className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex justify-center gap-2">
            {saving ? 'Saving...' : <><Save size={18} /> Save AI Settings</>}
          </button>
        </form>
      </div>
    )
  }

  if (activeTab === 'submissions') {
    return (
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">Date</th>
              {form.fields.map((f: any) => (
                <th key={f.id} className="px-4 py-3">{f.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {form.submissions.map((sub: any) => {
              const data = JSON.parse(sub.data)
              return (
                <tr key={sub.id}>
                  <td className="px-4 py-3 text-gray-500">{new Date(sub.createdAt).toLocaleString()}</td>
                  {form.fields.map((f: any) => (
                    <td key={f.id} className="px-4 py-3 bg-white">
                      {typeof data[f.id] === 'object' ? JSON.stringify(data[f.id]) : data[f.id]}
                    </td>
                  ))}
                </tr>
              )
            })}
             {form.submissions.length === 0 && (
               <tr><td colSpan={100} className="p-8 text-center text-gray-500">No submissions yet</td></tr>
             )}
          </tbody>
        </table>
      </div>
    )
  }

  if (activeTab === 'settings') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
        <form onSubmit={handleUpdateSettings} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Form Title</label>
            <input name="title" defaultValue={form.title} required className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" defaultValue={form.description || ''} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Button Text</label>
            <input name="submitText" defaultValue={form.submitText} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Success Message</label>
            <textarea name="successMsg" defaultValue={form.successMsg} className="w-full border rounded p-2" />
          </div>
           <div>
            <label className="block text-sm font-medium mb-1">Button Color</label>
            <input type="color" name="primaryColor" defaultValue={form.primaryColor} className="h-10 w-20 p-1 rounded border" />
          </div>
          <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[300px_1fr] gap-8">
      {/* Sidebar Controls */}
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-semibold text-gray-900 mb-3">Add Elements</h3>
          <div className="grid grid-cols-2 gap-2">
            {fieldTypes.map(ft => (
              <button
                key={ft.type}
                onClick={() => handleAddField(ft.type)}
                className="flex flex-col items-center justify-center p-3 border rounded hover:bg-gray-50 hover:border-blue-300 transition"
              >
                <div className="text-xl mb-1 text-gray-400">{ft.icon}</div>
                <div className="text-xs font-medium text-gray-600">{ft.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-2">
             <h3 className="font-medium text-blue-900">Preview Link</h3>
             <a href={`/f/${form.slug}`} target="_blank" className="text-xs text-blue-600 underline">Open</a>
          </div>
          <code className="block bg-white p-2 rounded text-xs text-blue-800 break-all border border-blue-100">
            {typeof window !== 'undefined' ? window.location.origin : ''}/f/{form.slug}
          </code>
        </div>
      </div>

      {/* Editor Canvas */}
      <div className="space-y-4">
        {form.fields.map((field: any, index: number) => (
          <div key={field.id} className="bg-white p-4 rounded-lg shadow-sm border group relative">
            <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition flex gap-2">
               <button onClick={() => handleDeleteField(field.id)} className="p-2 text-red-400 hover:text-red-600">
                 <Trash2 size={16} />
               </button>
            </div>
            
            <div className="flex gap-4 items-start">
               <div className="mt-3 flex flex-col gap-1 text-gray-400">
                 <button 
                   onClick={() => handleReorder(field.id, 'up')}
                   disabled={index === 0 || reordering === field.id}
                   className="p-1 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Move Up"
                  >
                   <ArrowUp size={16} />
                 </button>
                 <button 
                   onClick={() => handleReorder(field.id, 'down')}
                   disabled={index === form.fields.length - 1 || reordering === field.id}
                   className="p-1 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                   title="Move Down"
                  >
                   <ArrowDown size={16} />
                 </button>
               </div>
               <div className="flex-1 space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1 block">Label</label>
                      <input 
                        defaultValue={field.label}
                        onBlur={(e) => handleUpdateField(field.id, { label: e.target.value })}
                        className="w-full text-lg font-medium border-b border-transparent hover:border-gray-200 focus:border-blue-500 outline-none transition px-0 py-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1 block">Type</label>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 font-mono">{field.type}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm">
                     <label className="flex items-center gap-2 text-gray-600">
                       <input 
                         type="checkbox" 
                         defaultChecked={field.required}
                         onChange={(e) => handleUpdateField(field.id, { required: e.target.checked })}
                       />
                       Required
                     </label>
                     <input 
                       placeholder="Placeholder text..."
                       defaultValue={field.placeholder || ''}
                       onBlur={(e) => handleUpdateField(field.id, { placeholder: e.target.value })}
                       className="border rounded px-2 py-0.5 text-sm"
                     />
                  </div>

                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                    <div>
                      <label className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1 block">Options (comma separated)</label>
                      <textarea
                        defaultValue={field.options || ''}
                        onBlur={(e) => handleUpdateField(field.id, { options: e.target.value })}
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Option 1, Option 2, Option 3"
                        rows={2}
                      />
                    </div>
                  )}
               </div>
            </div>
          </div>
        ))}

        {form.fields.length === 0 && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center text-gray-400">
            Select a field type from the left to start building your form
          </div>
        )}
        
        {/* Preview Footer */}
        {form.fields.length > 0 && (
             <div className="flex justify-end pt-4 opacity-50 pointer-events-none">
                 <button className="px-6 py-2 rounded text-white" style={{ background: form.primaryColor }}>
                   {form.submitText}
                 </button>
             </div>
        )}
      </div>
      
      {/* Tab Navigation (Top - rendered via Portal or just sticky) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-2 py-2 rounded-full shadow-lg flex gap-2 z-50">
        <button 
          onClick={() => setActiveTab('build')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'build' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
        >
          Build
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'settings' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
        >
          Settings
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'ai' ? 'bg-purple-600' : 'hover:bg-gray-800'}`}
        >
          <Bot size={14} /> AI
        </button>
        <button 
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === 'submissions' ? 'bg-gray-700' : 'hover:bg-gray-800'}`}
        >
          Submissions ({form.submissions.length})
        </button>
      </div>
    </div>
  )
}

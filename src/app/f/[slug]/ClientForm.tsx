'use client'

import { useState } from 'react'
import { submitForm } from '@/app/actions/submitForm'
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

interface ClientFormProps {
  form: any
}

export default function ClientForm({ form }: ClientFormProps) {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)


  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return
    
    // Create FormData from the form element
    const formData = new FormData(event.currentTarget)
    
    try {
      setLoading(true)
      setError(null)
      setProgress(0)

      // Simulate 15 second progress
      const duration = 15000 // 15 seconds
      const interval = 100 // update every 100ms
      const steps = duration / interval
      
      for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, interval))
        setProgress(Math.min(Math.round(((i + 1) / steps) * 100), 99)) // Cap at 99% until done
      }
      

      
      const res = await submitForm(form.id, formData)
      setProgress(100)
      
      // Small delay to show 100%
      await new Promise(r => setTimeout(r, 500))

      if (res.success || res.status === 'REJECTED') { 
        setResult(res)
      } else {
        setError(res.message || 'Submission failed')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50 animate-in fade-in duration-200">
         <div className="w-full max-w-lg p-8 text-center space-y-8 animate-in zoom-in-95">
            <div className="space-y-6">
               <div className="mx-auto w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center relative">
                  <Loader2 className="w-12 h-12 animate-spin" />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-gray-900">Assessing Application...</h3>
                  <p className="text-gray-600 mt-2">Please wait while our AI reviews your information.</p>
                  <p className="text-purple-600 font-medium text-lg mt-4 animate-pulse">Make dua while you wait...</p>
               </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium text-gray-500">{progress}% complete</p>
         </div>
      </div>
    )
  }

  if (result) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50 animate-in fade-in duration-200">
         <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8 text-center space-y-8 relative animate-in zoom-in-95 border border-gray-100">
            {result.status !== 'REJECTED' && result.redirectUrl && (
               <div className="absolute top-0 left-0 w-full h-3 bg-green-500 rounded-t-3xl" />
            )}

            <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
                result.status === 'REJECTED' ? 'bg-red-100 text-red-600' : result.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
            }`}>
               {result.status === 'REJECTED' ? <XCircle size={48} /> : result.status === 'REVIEW' ? <AlertCircle size={48} /> : <CheckCircle2 size={48} />}
            </div>
            
            <div className="space-y-3">
                <h3 className="text-3xl font-bold text-gray-900">{result.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{result.message}</p>
            </div>

            <div className="pt-4">
                {result.status !== 'REJECTED' && result.redirectUrl ? (
                    <a 
                      href={result.redirectUrl}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0 w-full justify-center transform"
                    >
                      Proceed to Register <ArrowRight size={24} />
                    </a>
                ) : result.status === 'REJECTED' ? (
                    <button 
                      onClick={() => setResult(null)}
                      className="text-gray-500 hover:text-gray-900 underline font-medium hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                    >
                      Go back and try again
                    </button>
                ) : (
                    <button 
                      onClick={() => window.location.reload()}
                      className="bg-gray-900 text-white px-8 py-3 rounded-xl font-medium hover:bg-gray-800 shadow-md hover:shadow-lg transition-all"
                    >
                      Close Window
                    </button>
                )}
            </div>
         </div>
      </div>
    )
  }

  // Main Render
  return (
    <>
      {/* Form Content */}
      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {form.fields.map((field: any) => (
          <div key={field.id} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            
            {field.type === 'textarea' ? (
              <textarea
                name={field.id}
                required={field.required}
                placeholder={field.placeholder || ''}
                rows={4}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            ) : field.type === 'select' ? (
               <select
                 name={field.id}
                 required={field.required}
                 className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white"
               >
                 <option value="">Select an option...</option>
                 {field.options?.split(',').map((opt: string) => (
                   <option key={opt} value={opt.trim()}>{opt.trim()}</option>
                 ))}
               </select>
            ) : field.type === 'checkbox' ? (
               <div className="space-y-2 pt-1 border border-transparent">
                  {field.options ? (
                    field.options.split(',').map((opt: string) => (
                      <label key={opt} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input type="checkbox" name={field.id} value={opt.trim()} className="rounded text-blue-600 focus:ring-blue-500" />
                        {opt.trim()}
                      </label>
                    ))
                  ) : (
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                       <input type="checkbox" name={field.id} value="Yes" required={field.required} className="rounded text-blue-600 focus:ring-blue-500" />
                       {field.placeholder || 'Yes, I agree'}
                    </label>
                  )}
               </div>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                name={field.id}
                required={field.required}
                placeholder={field.placeholder || ''}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            )}
          </div>
        ))}

        <SubmitButtonBase text={form.submitText || 'Submit'} color={form.primaryColor} loading={loading} />
      </form>
    </>
  )
}

function SubmitButtonBase({ text, color, loading }: { text: string, color: string, loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{ backgroundColor: color }}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
    >
      {loading ? 'Submitting...' : text}
    </button>
  )
}


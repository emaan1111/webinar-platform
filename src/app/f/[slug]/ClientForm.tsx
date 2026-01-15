
'use client'

import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { submitForm } from '@/app/actions/submitForm'
import { Loader2, AlertCircle, CheckCircle2, XCircle, ArrowRight } from 'lucide-react'

interface ClientFormProps {
  form: any
}

export default function ClientForm({ form }: ClientFormProps) {
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    try {
      setLoading(true)
      setError(null)
      // Small delay to ensure loading animation is seen (UX)
      // await new Promise(r => setTimeout(r, 800)) 
      
      const res = await submitForm(form.id, formData)
      
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

  // Processing Modal
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center space-y-6">
          <div className="space-y-4">
             <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center relative">
                <Loader2 className="w-8 h-8 animate-spin" />
             </div>
             <div>
                <h3 className="text-xl font-semibold text-gray-900">Assessing Application...</h3>
                <p className="text-gray-500 text-sm mt-1">Please do not close this window while our AI reviews your information.</p>
             </div>
          </div>
          
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-2 rounded-full animate-progress-indeterminate"></div>
          </div>
        </div>
      </div>
    )
  }

  // Result Modal
  if (result) {
    const isRejected = result.status === 'REJECTED'
    const isReview = result.status === 'REVIEW'
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
         <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center space-y-6 relative">
            
            {!isRejected && result.redirectUrl && (
               <div className="absolute top-0 left-0 w-full h-2 bg-green-500 rounded-t-2xl" />
            )}

            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center ${
                isRejected ? 'bg-red-100 text-red-600' : isReview ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'
            }`}>
               {isRejected ? <XCircle size={40} /> : isReview ? <AlertCircle size={40} /> : <CheckCircle2 size={40} />}
            </div>
            
            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-900">{result.title}</h3>
                <p className="text-gray-600">{result.message}</p>
            </div>

            <div className="pt-2">
                {!isRejected && result.redirectUrl ? (
                    <a 
                      href={result.redirectUrl}
                      className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 w-full justify-center"
                    >
                      Proceed to Register <ArrowRight size={20} />
                    </a>
                ) : isRejected ? (
                    <button 
                      onClick={() => setResult(null)}
                      className="text-gray-500 hover:text-gray-800 underline text-sm"
                    >
                      Close and try again
                    </button>
                ) : (
                    <button 
                      onClick={() => window.location.reload()}
                      className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800"
                    >
                      Close
                    </button>
                )}
            </div>
         </div>
      </div>
    )
  }

  // Form Render
  return (
    <form action={handleSubmit} className="mt-8 space-y-6">
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

      <SubmitButtonBase text={form.submitText} color={form.primaryColor} />
    </form>
  )
}

function SubmitButtonBase({ text, color }: { text: string, color: string }) {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ backgroundColor: color }}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
    >
      {pending ? (
       'Submitting...'
      ) : text}
    </button>
  )
}

import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ClientForm from './ClientForm'

interface PageProps {
  params: { slug: string }
}

export const dynamic = 'force-dynamic'

export default async function PublicFormPage({ params }: PageProps) {
  const form = await prisma.form.findUnique({
    where: { slug: params.slug },
    include: {
      fields: {
        orderBy: { position: 'asc' }
      }
    }
  })

  // Check if form exists and is active
  if (!form || !form.isActive) {
    notFound()
  }

  return (
    <div 
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center bg-gray-50"
      style={{ backgroundColor: form.backgroundColor }}
    >
      <div className="max-w-xl w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
          {form.description && (
             <p className="mt-2 text-gray-600 whitespace-pre-line">{form.description}</p>
          )}
        </div>

        <ClientForm form={form} />

        <div className="text-center text-xs text-gray-400 mt-8">
          Powered by WebinarPlatform
        </div>
      </div>
    </div>
  )
}

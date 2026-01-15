
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import FormEditor from './FormEditor'

interface PageProps {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export default async function EditFormPage({ params }: PageProps) {
  const form = await prisma.form.findUnique({
    where: { id: params.id },
    include: {
      fields: {
        orderBy: { position: 'asc' }
      },
      submissions: {
        orderBy: { createdAt: 'desc' },
        take: 100 // Limit for now
      }
    }
  })

  if (!form) notFound()

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-6 border-b pb-4">
        <Link 
          href="/dashboard/forms" 
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
           <h1 className="text-xl font-bold text-gray-900">{form.title}</h1>
           <p className="text-xs text-gray-500">/{form.slug}</p>
        </div>
      </div>
      
      <FormEditor form={form} />
    </div>
  )
}

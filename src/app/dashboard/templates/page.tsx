'use client'

import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { FileText, Clock } from 'lucide-react'

export default function TemplatesPage() {
  const router = useRouter()

  const templateTypes = [
    {
      title: 'Thank You Pages',
      description: 'Manage templates displayed after users register for webinars',
      icon: FileText,
      href: '/dashboard/templates/thank-you',
      count: 'Manage all thank you page templates',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Countdown Pages',
      description: 'Manage templates shown before webinars start',
      icon: Clock,
      href: '/dashboard/templates/countdown',
      count: 'Manage all countdown page templates',
      color: 'from-blue-500 to-indigo-600'
    }
  ]

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
        <p className="text-gray-600 mt-2">
          Create, edit, and manage your thank you and countdown page templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templateTypes.map((type) => {
          const Icon = type.icon
          return (
            <div
              key={type.href}
              className="cursor-pointer transform transition-all hover:scale-105"
              onClick={() => router.push(type.href)}
            >
              <Card className="hover:shadow-xl transition-shadow h-full border-0 overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${type.color}`} />
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${type.color}`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{type.title}</h2>
                      <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <p className="text-gray-700 mb-4">{type.count}</p>
                  <button className={`w-full px-4 py-3 bg-gradient-to-r ${type.color} text-white rounded-lg hover:opacity-90 transition-all font-medium shadow-md hover:shadow-lg`}>
                    Manage Templates →
                  </button>
                </CardBody>
              </Card>
            </div>
          )
        })}
      </div>
    </DashboardLayout>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'

export default function TemplatesPage() {
  const router = useRouter()

  const templateTypes = [
    {
      title: '🎉 Thank You Pages',
      description: 'Manage templates displayed after users register for webinars',
      icon: '🎉',
      href: '/dashboard/templates/thank-you',
      count: 'Manage all thank you page templates'
    },
    {
      title: '⏳ Countdown Pages',
      description: 'Manage templates shown before webinars start',
      icon: '⏳',
      href: '/dashboard/templates/countdown',
      count: 'Manage all countdown page templates'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
          <p className="text-gray-600 mt-2">
            Create, edit, and manage your thank you and countdown page templates
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templateTypes.map((type) => (
            <div
              key={type.href}
              className="cursor-pointer"
              onClick={() => router.push(type.href)}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
                <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{type.icon}</div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{type.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <p className="text-gray-700">{type.count}</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Manage Templates →
                </button>
              </CardBody>
            </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

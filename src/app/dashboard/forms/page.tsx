
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { PlusCircle, FileText, ExternalLink, Trash2, Edit } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function FormsListPage() {
  const forms = await prisma.form.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { submissions: true }
      }
    }
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-500">Create and manage standalone forms</p>
        </div>
        <Link
          href="/dashboard/forms/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusCircle className="w-5 h-5" />
          Create Form
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {forms.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
            <p className="mb-6">Create your first form to start collecting data.</p>
            <Link
              href="/dashboard/forms/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <PlusCircle className="w-5 h-5" />
              Create Form
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">Title</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">Slug</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">Submissions</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm">Created</th>
                  <th className="px-6 py-3 font-semibold text-gray-700 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{form.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{form.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">/f/{form.slug}</code>
                        <a 
                          href={`/f/${form.slug}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {form._count.submissions}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/dashboard/forms/${form.id}`}
                          className="text-gray-500 hover:text-blue-600 transition"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        {/* Delete logic would go here, omitting for brevity in list view */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

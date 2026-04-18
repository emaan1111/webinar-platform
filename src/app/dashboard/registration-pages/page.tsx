'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Eye, Users, TrendingUp, Calendar, FileText, Edit, Copy, Trash2, Plus, FlaskConical } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  isSystem: boolean;
  isActiveABTest?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PageStats {
  pageId: string;
  views: number;
  uniqueVisitors: number;
  conversions: number;
  conversionRate: number;
  lastUsed: Date;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [statistics, setStatistics] = useState<Record<string, PageStats>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch templates
      const templatesResponse = await fetch('/api/registration-pages');
      if (templatesResponse.ok) {
        const data = await templatesResponse.json();
        setTemplates(data);
      }

      // Fetch statistics
      const statsResponse = await fetch('/api/registration-pages/stats');
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        const statsMap: Record<string, PageStats> = {};
        data.statistics.forEach((stat: PageStats) => {
          statsMap[stat.pageId] = stat;
        });
        setStatistics(statsMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    setDeleteId(id);
    try {
      const response = await fetch(`/api/registration-pages/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Template deleted successfully');
        fetchData();
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('An error occurred while deleting the template');
    } finally {
      setDeleteId(null);
    }
  };

  const handleDuplicate = (template: Template) => {
    // Navigate to new registration page with pre-filled data
    router.push(`/dashboard/registration-pages/new?duplicate=${template.id}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registration Pages</h1>
            <p className="mt-2 text-gray-600">
              Manage your custom registration page designs
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/registration-pages/new')}
            className="inline-flex items-center justify-center p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            title="Create new registration page"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-8 w-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No registration pages yet
          </h3>
          <p className="mb-6 text-gray-500">
            Get started by creating your first registration page
          </p>
          <Button
            onClick={() => router.push('/dashboard/registration-pages/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Registration Page
          </Button>
        </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Registration Page
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Unique Visitors
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Conversions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Conv. Rate
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Used
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates.map((template) => {
                    const stats = statistics[template.id];
                    return (
                      <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                        {/* Page Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900">
                                  {template.name}
                                </p>
                                {template.isSystem && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    System
                                  </span>
                                )}
                                {template.isActiveABTest && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider cursor-help w-max"
                                    title="Currently active in a Split Test"
                                  >
                                    <FlaskConical className="w-3 h-3" />
                                    In Split Test
                                  </span>
                                )}
                              </div>
                              {template.description && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                  {template.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Statistics */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {stats?.views || 0}
                            </span>
                            <span className="text-xs text-gray-500">total views</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-semibold text-gray-900">
                                {stats?.uniqueVisitors || 0}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">unique</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-green-600">
                              {stats?.conversions || 0}
                            </span>
                            <span className="text-xs text-gray-500">registrations</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1">
                              <TrendingUp className={`w-4 h-4 ${(stats?.conversionRate || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className={`text-sm font-semibold ${(stats?.conversionRate || 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                {stats?.conversionRate?.toFixed(1) || '0.0'}%
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">rate</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {stats?.lastUsed ? (
                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-600">
                                  {new Date(stats.lastUsed).toLocaleDateString()}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(stats.lastUsed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Never used</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => window.open(`/api/registration-pages/${template.id}/preview`, '_blank')}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Preview page"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/registration-pages/${template.id}/edit`)}
                              disabled={template.isSystem}
                              className={`p-2 rounded-lg transition-colors ${
                                template.isSystem
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
                              }`}
                              title={template.isSystem ? 'View (system page)' : 'Edit page'}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(template)}
                              className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Duplicate page"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            {!template.isSystem && (
                              <button
                                onClick={() => handleDelete(template.id)}
                                disabled={deleteId === template.id}
                                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={deleteId === template.id ? 'Deleting...' : 'Delete page'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Info Box */}
      <Card className="mt-8 border-l-4 border-blue-500 bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About Registration Pages
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Registration pages allow you to create custom registration forms with your own HTML, CSS, and JavaScript.
                System pages are pre-built and cannot be edited, but you can duplicate them to create your own versions.
              </p>
            </div>
          </div>
        </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

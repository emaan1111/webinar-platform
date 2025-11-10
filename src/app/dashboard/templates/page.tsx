'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Template {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
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
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Template deleted successfully');
        fetchTemplates();
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
    // Navigate to new template page with pre-filled data
    router.push(`/dashboard/templates/new?duplicate=${template.id}`);
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
          <Button onClick={() => router.push('/dashboard/templates/new')}>
            Create New Page
          </Button>
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
            No templates yet
          </h3>
          <p className="mb-6 text-gray-500">
            Get started by creating your first registration page template
          </p>
          <Button
            onClick={() => router.push('/dashboard/templates/new')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Template
          </Button>
        </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              {/* Template Preview */}
              <div className="aspect-video w-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {template.thumbnail ? (
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg
                      className="h-16 w-16 text-gray-400"
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
                )}
              </div>

              {/* Template Info */}
              <div className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {template.name}
                  </h3>
                  {template.isSystem && (
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      System
                    </span>
                  )}
                </div>

                {template.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {template.description}
                  </p>
                )}

                <p className="mb-4 text-xs text-gray-500">
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div className="space-y-2">
                  {/* Preview Button - Full Width */}
                  <Button
                    onClick={() => window.open(`/api/templates/${template.id}/preview`, '_blank')}
                    variant="primary"
                    className="w-full text-sm"
                  >
                    👁️ Preview Template
                  </Button>

                  {/* Other Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/dashboard/templates/${template.id}/edit`)}
                      variant="secondary"
                      className="flex-1 text-sm"
                      disabled={template.isSystem}
                    >
                      {template.isSystem ? 'View' : 'Edit'}
                    </Button>
                    
                    <Button
                      onClick={() => handleDuplicate(template)}
                      variant="secondary"
                      className="flex-1 text-sm"
                    >
                      Duplicate
                    </Button>
                    
                    {!template.isSystem && (
                      <Button
                        onClick={() => handleDelete(template.id)}
                        variant="danger"
                        className="text-sm"
                        disabled={deleteId === template.id}
                      >
                        {deleteId === template.id ? '...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          </div>
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
              About Templates
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Templates allow you to create custom registration pages with your own HTML, CSS, and JavaScript.
                System templates are pre-built and cannot be edited, but you can duplicate them to create your own versions.
              </p>
            </div>
          </div>
        </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

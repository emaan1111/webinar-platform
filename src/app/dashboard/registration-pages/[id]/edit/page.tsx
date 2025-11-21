'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { convertHtmlToRegistrationTemplate } from '@/lib/externalHtmlProcessor';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params?.id as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [isSystem, setIsSystem] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (templateId) {
      fetchTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/registration-pages/${templateId}`);
      if (response.ok) {
        const template = await response.json();
        setName(template.name);
        setDescription(template.description || '');
        setHtmlCode(template.htmlCode);
        setThumbnail(template.thumbnail || '');
        setIsSystem(template.isSystem);
      } else {
        alert('Template not found');
        router.push('/dashboard/templates');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      alert('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoConvert = () => {
    if (!htmlCode.trim()) {
      alert('Paste your HTML first, then click Auto-convert');
      return;
    }

    setConverting(true);
    try {
      const converted = convertHtmlToRegistrationTemplate(htmlCode);
      setHtmlCode(converted);
      setShowPreview(true);
      alert('✅ HTML converted. Buttons now open the webinar popup and old popups were removed.');
    } catch (error) {
      console.error('Auto-convert failed', error);
      alert('Auto-convert failed. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !htmlCode.trim()) {
      alert('Please fill in the template name and HTML code');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/registration-pages/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          htmlCode: htmlCode.trim(),
          thumbnail: thumbnail.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Template updated successfully!');
        router.push('/dashboard/templates');
      } else {
        alert(data.error || 'Failed to update template');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('An error occurred while updating the template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isSystem ? 'View Template' : 'Edit Template'}
        </h1>
        <p className="mt-2 text-gray-600">
          {isSystem
            ? 'System templates are read-only. You can duplicate them to create your own version.'
            : 'Edit your custom registration page template'}
        </p>
      </div>

      {isSystem && (
        <Card className="mb-6 border-l-4 border-yellow-500 bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                This is a system template and cannot be edited. You can duplicate it to create your own editable version.
              </p>
            </div>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Name */}
        <Card className="p-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            placeholder="e.g., Islamic Mothers Webinar"
            disabled={isSystem}
            required
          />
        </Card>

        {/* Description */}
        <Card className="p-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            placeholder="Brief description of this template"
            disabled={isSystem}
          />
        </Card>

        {/* Thumbnail URL */}
        <Card className="p-6">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Thumbnail URL (Optional)
          </label>
          <input
            type="url"
            value={thumbnail}
            onChange={(e) => setThumbnail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
            placeholder="https://example.com/preview.jpg"
            disabled={isSystem}
          />
        </Card>

        {/* HTML Code */}
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Complete HTML Code *
            </label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleAutoConvert}
                variant="secondary"
                className="text-sm"
                disabled={isSystem || converting}
              >
                {converting ? 'Converting...' : '⚡ Auto-convert HTML'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                variant="secondary"
                className="text-sm"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                className="h-96 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                placeholder="Paste your complete HTML here"
                disabled={isSystem}
                required
              />
            </div>

            {showPreview && (
              <div className="h-96 overflow-auto rounded-lg border border-gray-300 bg-white">
                {htmlCode ? (
                  <iframe
                    srcDoc={htmlCode}
                    className="h-full w-full"
                    title="Template Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    Enter HTML code to see preview
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={() => router.push('/dashboard/templates')}
            variant="secondary"
            disabled={saving}
          >
            Back
          </Button>
          {!isSystem && (
            <Button
              type="submit"
              variant="primary"
              disabled={saving || !name.trim() || !htmlCode.trim()}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </form>
    </DashboardLayout>
  );
}

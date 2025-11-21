'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { convertHtmlToRegistrationTemplate } from '@/lib/externalHtmlProcessor';

function NewTemplatePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams?.get('duplicate');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [popupStyle, setPopupStyle] = useState('center');
  const [popupTheme, setPopupTheme] = useState('purple');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [createdTemplateId, setCreatedTemplateId] = useState<string | null>(null);
  const [detectedButtons, setDetectedButtons] = useState<Array<{id: string, text: string, html: string}>>([]);
  const [selectedButtonIds, setSelectedButtonIds] = useState<Set<string>>(new Set());
  const [showButtonSelector, setShowButtonSelector] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (duplicateId) {
      fetchTemplateForDuplication(duplicateId);
    }
  }, [duplicateId]);

  const fetchTemplateForDuplication = async (id: string) => {
    try {
      const response = await fetch(`/api/registration-pages/${id}`);
      if (response.ok) {
        const template = await response.json();
        setName(`${template.name} (Copy)`);
        setDescription(template.description || '');
        setHtmlCode(template.htmlCode);
        setThumbnail(template.thumbnail || '');
      }
    } catch (error) {
      console.error('Error fetching template:', error);
    }
  };

  const detectButtons = () => {
    if (!htmlCode.trim()) {
      alert('Please enter HTML code first');
      return;
    }

    try {
      // Create a temporary DOM to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlCode, 'text/html');
      
      // Find all buttons and links
      const buttons = doc.querySelectorAll('button, a[href], input[type="button"], input[type="submit"]');
      
      const detected = Array.from(buttons).map((btn, index) => {
        const text = btn.textContent?.trim() || btn.getAttribute('value') || `Button ${index + 1}`;
        const tagName = btn.tagName.toLowerCase();
        const id = `btn-${index}`;
        
        // Get a preview of the HTML
        let html = btn.outerHTML;
        if (html.length > 100) {
          html = html.substring(0, 100) + '...';
        }
        
        return {
          id,
          text,
          html,
          element: btn
        };
      });

      setDetectedButtons(detected);
      
      if (detected.length === 0) {
        alert('No buttons or links found in your HTML. Add some buttons first!');
      } else {
        setShowButtonSelector(true);
      }
    } catch (error) {
      console.error('Error parsing HTML:', error);
      alert('Failed to parse HTML. Make sure your HTML is valid.');
    }
  };

  const toggleButtonSelection = (buttonId: string) => {
    const newSelection = new Set(selectedButtonIds);
    if (newSelection.has(buttonId)) {
      newSelection.delete(buttonId);
    } else {
      newSelection.add(buttonId);
    }
    setSelectedButtonIds(newSelection);
  };

  const applyButtonSelections = () => {
    if (selectedButtonIds.size === 0) {
      alert('Please select at least one button for registration');
      return;
    }

    // Parse HTML again and modify selected buttons
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, 'text/html');
    const allButtons = doc.querySelectorAll('button, a[href], input[type="button"], input[type="submit"]');
    
    // Remove all existing data-action attributes first
    allButtons.forEach(btn => {
      btn.removeAttribute('data-action');
    });
    
    // Modify selected buttons: add data-action="register" and remove href
    selectedButtonIds.forEach(selectedId => {
      const index = parseInt(selectedId.split('-')[1]);
      const button = allButtons[index];
      if (button) {
        // Add registration marker
        button.setAttribute('data-action', 'register');
        
        // If it's a link, remove href to prevent navigation
        if (button.tagName.toLowerCase() === 'a') {
          button.removeAttribute('href');
          // Add pointer cursor since links without href don't show it by default
          const existingStyle = button.getAttribute('style') || '';
          if (!existingStyle.includes('cursor')) {
            button.setAttribute('style', existingStyle + (existingStyle ? '; ' : '') + 'cursor: pointer;');
          }
        }
        
        // Remove onclick handlers that might interfere
        button.removeAttribute('onclick');
      }
    });

    // Update the HTML code with marked buttons
    const newHtml = doc.documentElement.outerHTML;
    setHtmlCode(newHtml);
    setShowButtonSelector(false);
    
    alert(`✅ ${selectedButtonIds.size} button(s) marked for registration!\n\n✨ Changes applied:\n• Added data-action="register"\n• Removed href (for links)\n• Removed onclick handlers\n\nThese buttons will now open the registration form.`);
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
      alert('Auto-convert failed. Please try again or select buttons manually.');
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
      const response = await fetch('/api/registration-pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          htmlCode: htmlCode.trim(),
          thumbnail: thumbnail.trim() || null,
          popupStyle: popupStyle,
          popupTheme: popupTheme,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCreatedTemplateId(data.id);
        // Don't redirect yet - show success message with preview option
      } else {
        alert(data.error || 'Failed to create template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('An error occurred while creating the template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Registration Page</h1>
        <p className="mt-2 text-gray-600">
          Create a custom registration page design with your own HTML, CSS, and JavaScript
        </p>
      </div>

      {/* Success Message */}
      {createdTemplateId && (
        <Card className="mb-6 border-l-4 border-green-500 bg-green-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900">
                Template Created Successfully! 🎉
              </h3>
              <p className="mt-2 text-green-800">
                Your template "{name}" has been saved and is ready to use.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => window.open(`/api/registration-pages/${createdTemplateId}/preview`, '_blank')}
                  variant="primary"
                  className="bg-green-600 hover:bg-green-700"
                >
                  👁️ Preview Template
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/dashboard/templates')}
                  variant="secondary"
                >
                  📋 View All Templates
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setCreatedTemplateId(null);
                    setName('');
                    setDescription('');
                    setHtmlCode('');
                    setThumbnail('');
                  }}
                  variant="secondary"
                >
                  ➕ Create Another Template
                </Button>
              </div>
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="e.g., Islamic Mothers Webinar"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Brief description of this template"
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
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="https://example.com/preview.jpg"
          />
          <p className="mt-1 text-xs text-gray-500">
            A screenshot or preview image of your template
          </p>
        </Card>

        {/* Popup Style & Theme */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Registration Popup Animation
            </label>
            <select
              value={popupStyle}
              onChange={(e) => setPopupStyle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="center">Center (Default)</option>
              <option value="slide-up">Slide Up from Bottom</option>
              <option value="slide-right">Slide In from Right</option>
              <option value="fade">Fade In</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose how the registration form appears
            </p>
          </Card>

          <Card className="p-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Registration Popup Theme
            </label>
            <select
              value={popupTheme}
              onChange={(e) => setPopupTheme(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="purple">Purple & Blue (Default)</option>
              <option value="blue">Blue & Cyan</option>
              <option value="green">Green & Emerald</option>
              <option value="red">Red & Pink</option>
              <option value="orange">Orange & Yellow</option>
              <option value="dark">Dark Gray</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose the color scheme for the popup
            </p>
          </Card>
        </div>

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
                disabled={converting}
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
                className="h-96 w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Paste your complete HTML here (including <!DOCTYPE html>, <head>, CSS, JS, etc.)"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Paste your complete HTML including embedded CSS and JavaScript.
                The system will automatically handle variable replacements.
              </p>
              
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={detectButtons}
                  variant="secondary"
                  className="text-sm"
                >
                  🔍 Detect & Select Registration Buttons
                </Button>
                <p className="mt-1 text-xs text-gray-500">
                  Click to find all buttons in your HTML and choose which ones should trigger registration
                </p>
              </div>
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

        {/* Button Selector Modal */}
        {showButtonSelector && (
          <Card className="border-2 border-purple-500 bg-purple-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-purple-900">
                🎯 Select Registration Buttons ({detectedButtons.length} found)
              </h3>
              <Button
                type="button"
                onClick={() => setShowButtonSelector(false)}
                variant="secondary"
                className="text-sm"
              >
                Cancel
              </Button>
            </div>

            <p className="mb-4 text-sm text-purple-800">
              Select which buttons should open the registration form. You can select multiple buttons.
            </p>

            <div className="mb-4 space-y-2">
              {detectedButtons.map((button) => (
                <div
                  key={button.id}
                  onClick={() => toggleButtonSelection(button.id)}
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    selectedButtonIds.has(button.id)
                      ? 'border-purple-600 bg-purple-100'
                      : 'border-gray-300 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedButtonIds.has(button.id)}
                      onChange={() => toggleButtonSelection(button.id)}
                      className="mt-1 h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {button.html.startsWith('<button') ? '🔘' : '🔗'}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {button.text}
                        </span>
                      </div>
                      <code className="mt-1 block text-xs text-gray-600">
                        {button.html}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-purple-200 pt-4">
              <p className="text-sm text-purple-800">
                {selectedButtonIds.size > 0 ? (
                  <span className="font-semibold">
                    ✅ {selectedButtonIds.size} button{selectedButtonIds.size > 1 ? 's' : ''} selected
                  </span>
                ) : (
                  <span>Select at least one button</span>
                )}
              </p>
              <Button
                type="button"
                onClick={applyButtonSelections}
                variant="primary"
                disabled={selectedButtonIds.size === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Apply Selection
              </Button>
            </div>
          </Card>
        )}

        {/* Variable Guide */}
        <Card className="border-l-4 border-blue-500 bg-blue-50 p-6">
          <h3 className="mb-3 text-sm font-semibold text-blue-900">
            📝 Available Template Variables
          </h3>
          <div className="grid gap-2 text-sm text-blue-800 sm:grid-cols-2">
            <div>
              <code className="rounded bg-blue-100 px-2 py-1">
                {`{{webinar.title}}`}
              </code>
              <span className="ml-2">- Webinar title</span>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1">
                {`{{webinar.description}}`}
              </code>
              <span className="ml-2">- Description</span>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1">
                {`{{webinar.duration}}`}
              </code>
              <span className="ml-2">- Duration in minutes</span>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1">
                {`{{webinar.host}}`}
              </code>
              <span className="ml-2">- Host name</span>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1">
                {`{{schedules}}`}
              </code>
              <span className="ml-2">- Schedule list (HTML)</span>
            </div>
          </div>
          <p className="mt-3 text-xs text-blue-700">
            Use these variables in your HTML, and they will be automatically replaced with actual webinar data.
          </p>
          <div className="mt-3 rounded-lg bg-blue-100 p-3">
            <p className="text-sm font-semibold text-blue-900">💡 Registration Buttons:</p>
            <p className="mt-1 text-xs text-blue-800">
              Use the "Detect & Select Registration Buttons" tool below to automatically mark which buttons should open the registration form. 
              The system will add <code className="rounded bg-white px-1">data-action="register"</code> to your selected buttons.
            </p>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            onClick={() => router.back()}
            variant="secondary"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || !name.trim() || !htmlCode.trim()}
          >
            {saving ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

export default function NewTemplatePage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <NewTemplatePageContent />
    </Suspense>
  );
}

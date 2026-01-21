'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function NewLeadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    type: 'TEMPLATE', // TEMPLATE or CUSTOM
    webinarId: '',
    templateId: '',
    htmlContent: '',
  });
  
  const [webinars, setWebinars] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch webinars and templates for dropdowns
    const fetchResources = async () => {
      try {
        const [wRes, tRes] = await Promise.all([
          fetch('/api/webinars'), // You might need a simplified list endpoint
          fetch('/api/registration-pages')
        ]);
        if (wRes.ok) {
           const data = await wRes.json();
           setWebinars(Array.isArray(data) ? data : (data.webinars || []));
        }
        if (tRes.ok) setTemplates(await tRes.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchResources();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/lead-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      if (res.ok) {
        router.push('/dashboard/lead-pages');
      } else {
        alert('Failed to create page');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/dashboard/lead-pages" className="hover:text-purple-600">Lead Pages</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">New Page</span>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Lead Page</h1>
        
        <Card className="p-6 space-y-6">
          {/* Step 1: Basic Info */}
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-medium mb-1">Internal Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-md" 
                  placeholder="e.g. FB Ad Variation A"
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                />
             </div>
             <div>
                <label className="block text-sm font-medium mb-1">URL Slug</label>
                <div className="flex items-center">
                    <span className="bg-gray-100 p-2 border border-r-0 rounded-l-md text-gray-500">/p/</span>
                    <input 
                    type="text" 
                    className="w-full p-2 border rounded-r-md" 
                    placeholder="my-special-offer"
                    value={form.slug}
                    onChange={e => setForm({...form, slug: e.target.value})}
                    />
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <label className="block text-sm font-medium">Page Type</label>
            <div className="grid grid-cols-2 gap-4">
                <button 
                   className={`p-4 border rounded-xl text-left hover:border-purple-500 transition-colors ${form.type === 'TEMPLATE' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : ''}`}
                   onClick={() => setForm({...form, type: 'TEMPLATE'})}
                >
                    <div className="font-bold mb-1">Use Template</div>
                    <div className="text-xs text-gray-500">Select one of your existing registration templates</div>
                </button>
                <button 
                   className={`p-4 border rounded-xl text-left hover:border-purple-500 transition-colors ${form.type === 'CUSTOM' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : ''}`}
                    onClick={() => setForm({...form, type: 'CUSTOM'})}
                >
                    <div className="font-bold mb-1">Custom HTML</div>
                    <div className="text-xs text-gray-500">Paste your own HTML code (ClickFunnels, Unbounce exports)</div>
                </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-1">Linked Webinar</label>
                <select 
                   className="w-full p-2 border rounded-md"
                   value={form.webinarId}
                   onChange={e => setForm({...form, webinarId: e.target.value})}
                >
                    <option value="">Select a webinar...</option>
                    {webinars.map(w => (
                        <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Registrations will be sent to this webinar</p>
              </div>

              {form.type === 'TEMPLATE' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Template</label>
                    <select 
                        className="w-full p-2 border rounded-md"
                        value={form.templateId}
                        onChange={e => setForm({...form, templateId: e.target.value})}
                    >
                        <option value="">Select a template...</option>
                        {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                  </div>
              )}

              {form.type === 'CUSTOM' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Custom HTML Code</label>
                    <textarea 
                        className="w-full p-2 border rounded-md h-40 font-mono text-xs"
                        placeholder="Paste your full <html>...</html> here"
                        value={form.htmlContent}
                        onChange={e => setForm({...form, htmlContent: e.target.value})}
                    />
                    <div className="bg-blue-50 p-4 rounded-md mt-4 text-sm text-blue-800">
                        <strong className="block mb-1">Important for Custom HTML:</strong>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>The system will automatically inject the registration modal logic.</li>
                            <li>Ensure your buttons have <code>onclick="openModal()"</code> or use the class <code>cta-button</code> to trigger the popup.</li>
                        </ul>
                    </div>
                  </div>
              )}
          </div>

          <div className="pt-6">
            <Button className="w-full" onClick={handleSubmit} disabled={loading || !form.name || !form.slug || !form.webinarId}>
                {loading ? 'Creating...' : 'Create Lead Page'}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

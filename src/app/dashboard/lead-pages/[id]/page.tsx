'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ChevronRight, Loader2, Trash2, RotateCcw, Sparkles, History, Undo2 } from 'lucide-react';
import Link from 'next/link';

type SaveMeta = {
  saveSource: string;
  aiPrompt: string;
  aiSummary: string;
} | null;

type LeadPageVersion = {
  id: string;
  source: string;
  changeSummary: string | null;
  prompt: string | null;
  createdByEmail: string | null;
  createdAt: string;
  charCount: number;
};

export default function EditLeadPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resettingStats, setResettingStats] = useState(false);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiPreviewHtml, setAiPreviewHtml] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [pendingSaveMeta, setPendingSaveMeta] = useState<SaveMeta>(null);

  const [versions, setVersions] = useState<LeadPageVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    type: 'TEMPLATE', 
    webinarId: '',
    templateId: '',
    htmlContent: '',
  });
  
  const [webinars, setWebinars] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const fetchVersions = async () => {
    setVersionsLoading(true);
    try {
      const res = await fetch(`/api/lead-pages/${id}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setVersionsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pageRes, wRes, tRes] = await Promise.all([
          fetch(`/api/lead-pages/${id}`),
          fetch('/api/webinars'),
          fetch('/api/registration-pages')
        ]);
        
        if (pageRes.ok) {
           const pageData = await pageRes.json();
           setForm({
               name: pageData.name,
               slug: pageData.slug,
               type: pageData.type,
               webinarId: pageData.webinarId || '',
               templateId: pageData.templateId || '',
               htmlContent: pageData.htmlContent || ''
           });
        }

        if (wRes.ok) {
           const data = await wRes.json();
           setWebinars(Array.isArray(data) ? data : (data.webinars || []));
        }
        if (tRes.ok) setTemplates(await tRes.json());
        await fetchVersions();
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/lead-pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(pendingSaveMeta || {}),
        })
      });
      
      if (res.ok) {
        setPendingSaveMeta(null);
        router.push('/dashboard/lead-pages');
        router.refresh();
      } else {
        alert('Failed to update page');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateAiPreview = async () => {
    if (!aiPrompt.trim()) {
      setAiError('Enter an instruction for the AI assistant first.');
      return;
    }

    if (!form.htmlContent.trim()) {
      setAiError('Your custom HTML is empty. Add HTML first, then ask AI to edit it.');
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const res = await fetch(`/api/lead-pages/${id}/ai-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: aiPrompt,
          currentHtml: form.htmlContent,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to generate preview');
      }

      setAiPreviewHtml(data.html || '');
      setAiSummary(data.summary || 'AI generated an updated version.');
    } catch (e: any) {
      setAiError(e?.message || 'Failed to generate preview');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiPreview = () => {
    if (!aiPreviewHtml.trim()) return;

    setForm((prev) => ({ ...prev, htmlContent: aiPreviewHtml }));
    setPendingSaveMeta({
      saveSource: 'ai_assistant',
      aiPrompt,
      aiSummary: aiSummary || 'Applied AI preview',
    });
    setAiError('');
  };

  const handleRestoreVersion = async (versionId: string) => {
    const confirmed = confirm('Restore this version? Your current unsaved HTML will be replaced.');
    if (!confirmed) return;

    setRestoringVersionId(versionId);
    try {
      const res = await fetch(`/api/lead-pages/${id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to restore version');

      setForm((prev) => ({
        ...prev,
        htmlContent: data.htmlContent || '',
      }));
      setPendingSaveMeta(null);
      await fetchVersions();
    } catch (e: any) {
      alert(e?.message || 'Failed to restore version');
    } finally {
      setRestoringVersionId(null);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this lead page? This cannot be undone.')) return;
    
    setDeleting(true);
    try {
        const res = await fetch(`/api/lead-pages/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            router.push('/dashboard/lead-pages');
            router.refresh();
        } else {
            alert('Failed to delete page');
        }
    } catch (e) {
        console.error(e);
    } finally {
        setDeleting(false);
    }
  };

  const handleResetStats = async () => {
    if (!confirm('Are you sure you want to reset all stats (views and conversions) for this lead page? This cannot be undone.')) return;
    
    setResettingStats(true);
    try {
        const res = await fetch(`/api/lead-pages/${id}/reset-stats`, {
            method: 'POST'
        });
        
        if (res.ok) {
            alert('Stats have been reset successfully');
        } else {
            alert('Failed to reset stats');
        }
    } catch (e) {
        console.error(e);
        alert('Failed to reset stats');
    } finally {
        setResettingStats(false);
    }
  };

  if (loading) {
      return (
          <DashboardLayout>
              <div className="flex justify-center items-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
          </DashboardLayout>
      );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/dashboard/lead-pages" className="hover:text-purple-600">Lead Pages</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900">Edit Page</span>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Edit Lead Page</h1>
            <div className="flex items-center gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleResetStats} 
                    disabled={resettingStats}
                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                    {resettingStats ? 'Resetting...' : <div className="flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Reset Stats</div>}
                </Button>
                <Button variant="danger" size="sm" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : <div className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete</div>}
                </Button>
            </div>
        </div>
        
        <Card className="p-6 space-y-6">
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
                    <label className="block text-sm font-medium mb-1">Paste HTML Code</label>
                    <textarea 
                       className="w-full p-2 border rounded-md font-mono text-sm h-64"
                       value={form.htmlContent}
                       onChange={e => {
                         setForm({...form, htmlContent: e.target.value});
                         setPendingSaveMeta(null);
                       }}
                       placeholder="<html>...</html>"
                    />
                    <div className="bg-blue-50 p-4 rounded-md mt-4 text-sm text-blue-800">
                        <strong className="block mb-1">Important for Custom HTML:</strong>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>The system will automatically inject the registration modal logic.</li>
                            <li>Ensure your buttons have <code>onclick="openModal()"</code> or use the class <code>cta-button</code> to trigger the popup.</li>
                        </ul>
                    </div>

                    <div className="mt-6 border rounded-xl p-4 bg-purple-50/40 space-y-4">
                      <div className="flex items-center gap-2 text-purple-900">
                        <Sparkles className="w-4 h-4" />
                        <h3 className="font-semibold">AI Assistant for Custom Code</h3>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">What should be changed?</label>
                        <textarea
                          className="w-full p-2 border rounded-md text-sm h-24"
                          placeholder="Example: Change headline to 'Limited Time Offer', update price to $27, and replace the book image URL with https://..."
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" onClick={handleGenerateAiPreview} disabled={aiLoading || !aiPrompt.trim()}>
                          {aiLoading ? 'Generating Preview...' : 'Generate AI Preview'}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyAiPreview}
                          disabled={!aiPreviewHtml.trim()}
                        >
                          Apply Preview to Editor
                        </Button>
                        {pendingSaveMeta && (
                          <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-md">
                            AI changes applied. Click Save Changes to publish.
                          </span>
                        )}
                      </div>

                      {aiError && (
                        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-2">
                          {aiError}
                        </div>
                      )}

                      {aiSummary && (
                        <div className="text-sm text-purple-900 bg-white border border-purple-200 rounded-md p-2">
                          <strong>AI Summary:</strong> {aiSummary}
                        </div>
                      )}

                      {aiPreviewHtml && (
                        <div className="grid gap-4 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">AI Generated HTML (Preview)</p>
                            <textarea
                              className="w-full p-2 border rounded-md font-mono text-xs h-56 bg-white"
                              value={aiPreviewHtml}
                              onChange={(e) => setAiPreviewHtml(e.target.value)}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Rendered Preview</p>
                            <div className="h-56 overflow-auto rounded-md border bg-white">
                              <iframe
                                title="AI HTML Preview"
                                srcDoc={aiPreviewHtml}
                                className="h-full w-full"
                                sandbox="allow-same-origin allow-scripts allow-forms"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 border rounded-xl p-4 bg-gray-50 space-y-3">
                      <div className="flex items-center gap-2 text-gray-900">
                        <History className="w-4 h-4" />
                        <h3 className="font-semibold">Version History</h3>
                      </div>

                      {versionsLoading ? (
                        <div className="text-sm text-gray-500">Loading versions...</div>
                      ) : versions.length === 0 ? (
                        <div className="text-sm text-gray-500">No saved versions yet. A version is created each time custom HTML is saved.</div>
                      ) : (
                        <div className="space-y-2 max-h-72 overflow-auto pr-1">
                          {versions.map((version) => (
                            <div key={version.id} className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">{version.changeSummary || 'Saved version'}</p>
                                <p className="text-xs text-gray-500 truncate">
                                  {new Date(version.createdAt).toLocaleString()} • {version.source} • {version.charCount} chars
                                  {version.createdByEmail ? ` • ${version.createdByEmail}` : ''}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleRestoreVersion(version.id)}
                                disabled={restoringVersionId === version.id}
                              >
                                <span className="flex items-center gap-1">
                                  <Undo2 className="w-3 h-3" />
                                  {restoringVersionId === version.id ? 'Restoring...' : 'Restore'}
                                </span>
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
              )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href="/dashboard/lead-pages">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

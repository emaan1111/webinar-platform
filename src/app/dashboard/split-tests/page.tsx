'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, ExternalLink, Copy, TrendingUp, Filter } from 'lucide-react';
import Link from 'next/link';

export default function SplitTestsDashboard() {
  const router = useRouter();
  const [splitTests, setSplitTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // all, 1h, 24h, 7d, 30d
  const [editingTest, setEditingTest] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', slug: '' });

  // Leads Modal State
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedVariantName, setSelectedVariantName] = useState<string>('');

  const getFromDateISOString = () => {
    if (timeRange === 'all') return null;

    const now = new Date();
    const fromDate = new Date();

    switch (timeRange) {
      case '1h':
        fromDate.setHours(now.getHours() - 1);
        break;
      case '24h':
        fromDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        fromDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        fromDate.setDate(now.getDate() - 30);
        break;
      default:
        return null;
    }

    return fromDate.toISOString();
  };

  const dedupeLeadsForDisplay = (rows: any[]) => {
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const row of rows) {
      const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
      const name = typeof row.name === 'string' ? row.name.trim().toLowerCase() : '';
      const dedupeKey = email || `${name}:${row.type || 'unknown'}:${row.id}`;

      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      unique.push(row);
    }

    return unique;
  };

  useEffect(() => {
    fetchSplitTests();
  }, [timeRange]);

  const fetchSplitTests = async () => {
    setLoading(true);
    try {
      let url = '/api/split-tests';
      
      const from = getFromDateISOString();
      // Add cache buster to force fresh data from API
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      params.set('_t', Date.now().toString());
      url += `?${params.toString()}`;
      
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        setSplitTests(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch split tests', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this split test? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/split-tests/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSplitTests(splitTests.filter(t => t.id !== id));
      } else {
        alert('Failed to delete split test');
      }
    } catch (error) {
      console.error('Failed to delete split test', error);
      alert('An error occurred while deleting');
    }
  };

  const handleEdit = (test: any) => {
    setEditingTest(test.id);
    setEditForm({ name: test.name, slug: test.slug });
  };

  const handleCancelEdit = () => {
    setEditingTest(null);
    setEditForm({ name: '', slug: '' });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/split-tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const updatedTest = await res.json();
        setSplitTests(splitTests.map(t => (t.id === id ? { ...t, ...updatedTest } : t)));
        setEditingTest(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update split test');
      }
    } catch (error) {
      console.error('Failed to update split test', error);
      alert('An error occurred while updating');
    }
  };

  const handleShowLeads = async (testId: string, variantId?: string, variantName?: string, type?: 'webinar' | 'form') => {
      setLeadsModalOpen(true);
      setLeadsLoading(true);
      setSelectedVariantName(variantName || 'All Variants');
      setLeads([]);
      try {
          const params = new URLSearchParams();
          if (variantId) params.set('variantId', variantId);
          if (type) params.set('type', type);
          const from = getFromDateISOString();
          if (from) params.set('from', from);
          params.set('_t', Date.now().toString()); // Cache buster
          const url = `/api/split-tests/${testId}/leads?${params.toString()}`;
          
          const res = await fetch(url, { cache: 'no-store' });
          if (res.ok) {
              const data = await res.json();
              setLeads(dedupeLeadsForDisplay(data));
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLeadsLoading(false);
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied!');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Split Tests
          </h1>
          <p className="text-gray-600 mt-1">A/B test multiple lead pages to optimize conversion</p>
        </div>
        <div className="flex gap-4">
            <select 
                className="border rounded-md px-3 py-2 text-sm bg-white"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
            >
                <option value="all">All Time</option>
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
            </select>
            
            <Link href="/dashboard/split-tests/new">
                <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Split Test
                </Button>
            </Link>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : splitTests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No split tests found.</p>
          <Link href="/dashboard/split-tests/new">
            <Button>Create Your First Test</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {splitTests.map((test) => (
            <Card key={test.id} className="p-6 hover:shadow-lg transition-shadow">
              {editingTest === test.id ? (
                <div className="mb-6 space-y-4 border-b pb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Test Name</label>
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug URL</label>
                    <div className="flex items-center">
                        <span className="bg-gray-100 border border-r-0 border-gray-300 rounded-l px-3 py-2 text-gray-500 font-mono text-sm">/t/</span>
                        <input
                        type="text"
                        className="w-full border border-gray-300 rounded-r px-3 py-2 font-mono text-sm"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({ ...editForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={() => handleSaveEdit(test.id)}>Save Changes</Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-xl">
                                <Link href={`/dashboard/split-tests/${test.id}`} className="hover:text-blue-600 hover:underline">
                                    {test.name}
                                </Link>
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {test.isActive ? 'ACTIVE' : 'PAUSED'}
                            </span>
                        </div>
                        <div className="text-sm font-mono text-purple-600 mt-1">/t/{test.slug}</div>
                        {test.updatedAt && test.updatedAt !== test.createdAt && (
                          <div className="text-xs text-gray-400 mt-1">Last edited {new Date(test.updatedAt).toLocaleDateString()} {new Date(test.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/dashboard/split-tests/${test.id}`}>
                            <Button variant="outline" size="sm" title="View Analytics">
                                <TrendingUp className="w-4 h-4 text-blue-600" />
                            </Button>
                        </Link>
                        <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/t/${test.slug}`)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(test)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(test.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
              )}

              {/* Variants List */}
              <div className="space-y-4">
                 <div className="grid grid-cols-12 text-xs font-bold text-gray-500 uppercase pb-2 border-b gap-1">
                     <div className="col-span-3">Variant Page</div>
                     <div className="col-span-1 text-center">Weight</div>
                     <div className="col-span-2 text-center">Visitors</div>
                     <div className="col-span-2 text-center text-blue-600">Webinar Reg</div>
                     <div className="col-span-2 text-center text-purple-600">Trial Leads</div>
                     <div className="col-span-2 text-right">Conv. Rate</div>
                 </div>
                 
                 {test.variants.map((v: any) => {
                    // Conversion Rate based on UNIQUE views and UNIQUE conversions
                    const uniqueViews = v.uniqueViews || 0;
                    const uniqueTotalConversions = (v.uniqueRegistrations || 0) + (v.uniqueFormSubmissions || 0); // Use specific sums
                    
                    const conversionRate = uniqueViews > 0 ? ((uniqueTotalConversions / uniqueViews) * 100).toFixed(1) : 0;
                    
                    return (
                        <div key={v.id} className="grid grid-cols-12 items-center text-sm py-2 border-b last:border-0 hover:bg-gray-50 gap-1">
                            <div className="col-span-3 font-medium flex items-center gap-2 overflow-hidden">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.weight > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                <span className="truncate" title={v.leadPage.name}>{v.leadPage.name}</span>
                                <div className="flex items-center gap-1 flex-shrink-0 ml-auto">
                                    <a
                                        href={`/p/${v.leadPage.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title="Preview page in a new tab"
                                        className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                    <Link
                                        href={`/dashboard/lead-pages/${v.leadPageId}`}
                                        title="Edit page"
                                        className="p-1 rounded text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                            <div className="col-span-1 text-center text-gray-500">
                                {v.weight}%
                            </div>
                            <div className="col-span-2 text-center">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900">{uniqueViews}</span>
                                    <span className="text-[10px] text-gray-400">Unique</span>
                                </div>
                            </div>
                            <div className="col-span-2 text-center">
                                <div 
                                    className="flex flex-col cursor-pointer hover:bg-blue-50 p-1 rounded transition group"
                                    onClick={() => handleShowLeads(test.id, v.id, `${v.leadPage.name} (Webinar)`, 'webinar')}
                                >
                                    <span className="font-bold text-blue-600 group-hover:underline decoration-dotted">{v.uniqueRegistrations || 0}</span>
                                    <span className="text-[10px] text-gray-400">Unique</span>
                                </div>
                            </div>
                            <div className="col-span-2 text-center">
                                <div 
                                    className="flex flex-col cursor-pointer hover:bg-purple-50 p-1 rounded transition group"
                                    onClick={() => handleShowLeads(test.id, v.id, `${v.leadPage.name} (Trial)`, 'form')}
                                >
                                    <span className="font-bold text-purple-600 group-hover:underline decoration-dotted">{v.uniqueFormSubmissions || 0}</span>
                                    <span className="text-[10px] text-gray-400">Unique</span>
                                </div>
                            </div>
                            <div className="col-span-2 text-right">
                                <div className="flex flex-col items-end">
                                    <span className={`font-bold text-lg ${Number(conversionRate) > 20 ? 'text-green-600' : Number(conversionRate) > 10 ? 'text-blue-600' : 'text-gray-800'}`}>
                                        {conversionRate}%
                                    </span>
                                    <span className="text-[10px] text-gray-400">Total Conv.</span>
                                </div>
                            </div>
                        </div>
                    );
                 })}

                 {/* Total Row */}
                 {(() => {
                    const totalUniqueViews = test.variants.reduce((acc: number, v: any) => acc + (v.uniqueViews || 0), 0);
                    const totalUniqueRegistrations = test.variants.reduce((acc: number, v: any) => acc + (v.uniqueRegistrations || 0), 0);
                    const totalUniqueFormSubmissions = test.variants.reduce((acc: number, v: any) => acc + (v.uniqueFormSubmissions || 0), 0);
                    
                    const totalConversions = totalUniqueRegistrations + totalUniqueFormSubmissions;
                    const totalConversionRate = totalUniqueViews > 0 ? ((totalConversions / totalUniqueViews) * 100).toFixed(1) : '0.0';
                    
                    return (
                        <div className="grid grid-cols-12 items-center text-sm py-3 border-t-2 border-gray-100 bg-gray-50/50 mt-1 font-medium gap-1">
                            <div className="col-span-3 pl-8 text-gray-600 uppercase text-xs tracking-wider">Totals</div>
                            <div className="col-span-1 text-center text-gray-400">-</div>
                            <div className="col-span-2 text-center text-gray-900">{totalUniqueViews}</div>
                            <div className="col-span-2 text-center text-blue-900 cursor-pointer hover:underline" onClick={() => handleShowLeads(test.id, undefined, 'All Variants (Webinars)', 'webinar')}>{totalUniqueRegistrations}</div>
                            <div className="col-span-2 text-center text-purple-900 cursor-pointer hover:underline" onClick={() => handleShowLeads(test.id, undefined, 'All Variants (Trials)', 'form')}>{totalUniqueFormSubmissions}</div>
                            <div className="col-span-2 text-right">
                                <span className="text-gray-900 mr-2">{totalConversionRate}%</span>
                            </div>
                        </div>
                    );
                 })()}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Leads Modal */}
      {leadsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">Conversion Leads</h3>
                <p className="text-sm text-gray-500">{selectedVariantName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLeadsModalOpen(false)}>Close</Button>
            </div>
            <div className="flex-1 overflow-auto p-0">
              {leadsLoading ? (
                <div className="p-8 text-center text-gray-500">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No leads records found for this variant.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Name</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Email</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{lead.name}</td>
                        <td className="px-6 py-3 text-gray-600">{lead.email}</td>
                        <td className="px-6 py-3 text-right text-gray-500">
                          {new Date(lead.registeredAt).toLocaleDateString()}
                          <span className="text-xs ml-1 text-gray-400">
                             {new Date(lead.registeredAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
               <span className="text-xs text-gray-500 mr-2">Unique Leads Shown: {leads.length}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

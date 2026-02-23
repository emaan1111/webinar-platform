'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, ExternalLink, Copy, Users, Calendar, Clock, ChevronDown } from 'lucide-react';
import Link from 'next/link';

type DateFilterType = 'all' | 'last1h' | 'last24h' | 'today' | 'last7d' | 'last30d' | 'custom';

const dateFilterOptions: { value: DateFilterType; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'last1h', label: 'Last Hour' },
  { value: 'last24h', label: 'Last 24 Hours' },
  { value: 'today', label: 'Today' },
  { value: 'last7d', label: 'Last 7 Days' },
  { value: 'last30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export default function LeadPagesDashboard() {
  const router = useRouter();
  const [leadPages, setLeadPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Leads Modal State
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedPageName, setSelectedPageName] = useState('');

  useEffect(() => {
    fetchLeadPages();
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchLeadPages = async () => {
    setLoading(true);
    try {
      let url = '/api/lead-pages';
      const params = new URLSearchParams();
      
      if (dateFilter !== 'all') {
        params.set('dateFilter', dateFilter);
        if (dateFilter === 'custom') {
          if (customStartDate) params.set('startDate', customStartDate);
          if (customEndDate) params.set('endDate', customEndDate);
        }
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const res = await fetch(url);
      if (res.ok) {
        setLeadPages(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch lead pages', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (filter: DateFilterType) => {
    setDateFilter(filter);
    if (filter !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  const getDisplayStats = (page: any) => {
    // If date filter is applied and we have filtered stats, use those
    if (dateFilter !== 'all' && page.filteredViews !== undefined) {
      return {
        views: page.filteredViews,
        conversions: page.filteredConversions
      };
    }
    // Otherwise use the stored totals
    return {
      views: page.views,
      conversions: page.conversions
    };
  };

  const getConversionRate = (page: any) => {
    const { views, conversions } = getDisplayStats(page);
    if (!views) return '0%';
    return `${((conversions / views) * 100).toFixed(1)}%`;
  };

  const handleShowLeads = async (pageId: string, pageName: string) => {
    setLeadsModalOpen(true);
    setLeadsLoading(true);
    setSelectedPageName(pageName);
    setLeads([]);
    
    try {
      const res = await fetch(`/api/lead-pages/${pageId}/leads`);
      if (res.ok) {
        setLeads(await res.json());
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

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) return;
    
    try {
        const res = await fetch(`/api/lead-pages/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            setLeadPages(leadPages.filter(p => p.id !== id));
        } else {
            alert('Failed to delete page');
        }
    } catch (e) {
        console.error(e);
        alert('An error occurred');
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Lead Pages
          </h1>
          <p className="text-gray-600 mt-1">Create unlimited registration pages for your webinars</p>
        </div>
        <Link href="/dashboard/lead-pages/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create New Page
          </Button>
        </Link>
      </div>

      {/* Date Filter */}
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <div className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Calendar className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">
              {dateFilterOptions.find(o => o.value === dateFilter)?.label}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          
          {showDateDropdown && (
            <div className="absolute z-20 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {dateFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleDateFilterChange(option.value)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                    dateFilter === option.value ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        )}

        {dateFilter !== 'all' && (
          <button
            onClick={() => setDateFilter('all')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Clock className="w-6 h-6 animate-spin text-purple-600" />
          <span className="ml-2 text-gray-600">Loading...</span>
        </div>
      ) : leadPages.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No lead pages found. Create your first one!</p>
          <Link href="/dashboard/lead-pages/new">
            <Button>Create Lead Page</Button>
          </Link>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Page</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Linked Webinar</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs">Template</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Views</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Conv</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Conv %</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leadPages.map((page) => {
                  const stats = getDisplayStats(page);

                  return (
                    <tr key={page.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{page.name}</div>
                        {dateFilter !== 'all' && (
                          <div className="text-xs text-gray-400 mt-1">Filtered stats applied</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-purple-600">
                          /p/{page.slug}
                        </code>
                      </td>
                      <td className="px-4 py-4 text-gray-700 max-w-[220px] truncate">
                        {page.webinar?.title || 'None'}
                      </td>
                      <td className="px-4 py-4 text-gray-700">
                        {page.template?.name || 'Custom HTML'}
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">
                        {stats.views}
                      </td>
                      <td className="px-4 py-4 text-right font-medium">
                        <button
                          onClick={() => handleShowLeads(page.id, page.name)}
                          className="text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
                          title="Click to view leads"
                        >
                          {stats.conversions}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right font-medium text-gray-900">
                        {getConversionRate(page)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(`${window.location.origin}/p/${page.slug}`)}
                          >
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </Button>
                          <a
                            href={`/p/${page.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border rounded-md hover:bg-gray-50 text-gray-600"
                            title="Open page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <Link href={`/dashboard/lead-pages/${page.id}`}>
                            <Button variant="secondary" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(page.id, page.name)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

      {/* Leads Modal */}
      {leadsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  Conversion Leads
                </h3>
                <p className="text-sm text-gray-500">{selectedPageName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLeadsModalOpen(false)}>Close</Button>
            </div>
            <div className="flex-1 overflow-auto p-0">
              {leadsLoading ? (
                <div className="p-8 text-center text-gray-500">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No leads found for this page yet.</p>
                  <p className="text-xs mt-1">Leads will appear here when people register through this page.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Name</th>
                      <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase text-xs">Email</th>
                      <th className="px-6 py-3 text-center font-medium text-gray-500 uppercase text-xs">Attended</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase text-xs">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{lead.name}</td>
                        <td className="px-6 py-3 text-gray-600">{lead.email}</td>
                        <td className="px-6 py-3 text-center">
                          {lead.attended ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              No
                            </span>
                          )}
                        </td>
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
              <span className="text-xs text-gray-500 mr-2">Total Leads: {leads.length}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

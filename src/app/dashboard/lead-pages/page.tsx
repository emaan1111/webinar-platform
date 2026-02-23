'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Plus, Edit, Trash2, ExternalLink, Copy, Users, Calendar, Clock,
  ChevronDown, ChevronRight, Folder, FolderOpen, Pencil,
  Check, X
} from 'lucide-react';
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

const UNCATEGORIZED = '__uncategorized__';

export default function LeadPagesDashboard() {
  const router = useRouter();
  const [leadPages, setLeadPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Webinar filter
  const [webinars, setWebinars] = useState<{ id: string; title: string }[]>([]);
  const [webinarFilter, setWebinarFilter] = useState('all');

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Folder UI State
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [renamingFolder, setRenamingFolder] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [folderPickerPageId, setFolderPickerPageId] = useState<string | null>(null);
  const [newFolderInput, setNewFolderInput] = useState('');
  const folderPickerRef = useRef<HTMLDivElement>(null);

  // Leads Modal State
  const [leadsModalOpen, setLeadsModalOpen] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [selectedPageName, setSelectedPageName] = useState('');

  // Close folder picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setFolderPickerPageId(null);
        setNewFolderInput('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch webinars for filter
  useEffect(() => {
    fetch('/api/webinars')
      .then(r => r.json())
      .then(data => {
        const list = data.webinars ?? data;
        if (Array.isArray(list)) {
          setWebinars(list.map((w: any) => ({ id: w.id, title: w.internalName || w.title })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchLeadPages();
  }, [dateFilter, customStartDate, customEndDate, webinarFilter]);

  const fetchLeadPages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFilter !== 'all') {
        params.set('dateFilter', dateFilter);
        if (dateFilter === 'custom') {
          if (customStartDate) params.set('startDate', customStartDate);
          if (customEndDate) params.set('endDate', customEndDate);
        }
      }
      if (webinarFilter !== 'all') params.set('webinarId', webinarFilter);

      const url = '/api/lead-pages' + (params.toString() ? '?' + params.toString() : '');
      const res = await fetch(url);
      if (res.ok) setLeadPages(await res.json());
    } catch (error) {
      console.error('Failed to fetch lead pages', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayStats = (page: any) => {
    if (dateFilter !== 'all' && page.filteredViews !== undefined) {
      return { views: page.filteredViews, conversions: page.filteredConversions };
    }
    return { views: page.views, conversions: page.conversions };
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
      if (res.ok) setLeads(await res.json());
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
      const res = await fetch(`/api/lead-pages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeadPages(prev => prev.filter(p => p.id !== id));
      } else {
        alert('Failed to delete page');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred');
    }
  };

  // --- Folder operations ---

  const assignFolder = async (pageId: string, folder: string | null) => {
    try {
      await fetch(`/api/lead-pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: folder || null }),
      });
      setLeadPages(prev => prev.map(p => p.id === pageId ? { ...p, folder: folder || null } : p));
    } catch (e) {
      console.error(e);
    } finally {
      setFolderPickerPageId(null);
      setNewFolderInput('');
    }
  };

  const renameFolder = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName.trim() === oldName) {
      setRenamingFolder(null);
      return;
    }
    const trimmed = newName.trim();
    const pagesInFolder = leadPages.filter(p => p.folder === oldName);
    await Promise.all(pagesInFolder.map(p =>
      fetch(`/api/lead-pages/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: trimmed }),
      })
    ));
    setLeadPages(prev => prev.map(p => p.folder === oldName ? { ...p, folder: trimmed } : p));
    setRenamingFolder(null);
  };

  // --- Derived folder structure ---
  const allFolders = Array.from(
    new Set(leadPages.map(p => p.folder).filter(Boolean))
  ).sort() as string[];

  const groupedPages: Record<string, any[]> = {};
  for (const folder of allFolders) {
    groupedPages[folder] = leadPages.filter(p => p.folder === folder);
  }
  groupedPages[UNCATEGORIZED] = leadPages.filter(p => !p.folder);

  const toggleFolder = (folder: string) => {
    setCollapsedFolders(prev => {
      const s = new Set(prev);
      s.has(folder) ? s.delete(folder) : s.add(folder);
      return s;
    });
  };

  const renderPageRow = (page: any) => {
    const stats = getDisplayStats(page);
    const isPickerOpen = folderPickerPageId === page.id;

    return (
      <tr key={page.id} className="hover:bg-gray-50">
        <td className="px-4 py-4">
          <div className="font-medium text-gray-900">{page.name}</div>
          {dateFilter !== 'all' && (
            <div className="text-xs text-gray-400 mt-0.5">Filtered stats applied</div>
          )}
        </td>
        <td className="px-4 py-4">
          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-purple-600">
            /p/{page.slug}
          </code>
        </td>
        <td className="px-4 py-4 text-gray-700 max-w-[200px] truncate text-sm">
          {page.webinar ? (page.webinar.internalName || page.webinar.title) : (
            <span className="text-gray-400 italic">None</span>
          )}
        </td>
        {/* Folder picker cell */}
        <td className="px-4 py-4 relative">
          <div className="relative inline-block" ref={isPickerOpen ? folderPickerRef : undefined}>
            <button
              onClick={() => {
                setFolderPickerPageId(isPickerOpen ? null : page.id);
                setNewFolderInput('');
              }}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                page.folder
                  ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Folder className="w-3 h-3" />
              {page.folder || 'No folder'}
              <ChevronDown className="w-3 h-3" />
            </button>

            {isPickerOpen && (
              <div className="absolute z-30 top-full left-0 mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Move to folder
                </div>
                {page.folder && (
                  <button
                    onClick={() => assignFolder(page.id, null)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-500 italic"
                  >
                    No folder (remove)
                  </button>
                )}
                {allFolders.filter(f => f !== page.folder).map(folder => (
                  <button
                    key={folder}
                    onClick={() => assignFolder(page.id, folder)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 text-gray-700 flex items-center gap-2"
                  >
                    <Folder className="w-3.5 h-3.5 text-purple-400" />
                    {folder}
                  </button>
                ))}
                <div className="border-t mt-1 pt-1 px-3 pb-2">
                  <p className="text-xs text-gray-400 mb-1.5">New folder</p>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newFolderInput}
                      onChange={e => setNewFolderInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newFolderInput.trim()) {
                          assignFolder(page.id, newFolderInput.trim());
                        }
                      }}
                      placeholder="Folder name..."
                      className="flex-1 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-purple-400 focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={() => newFolderInput.trim() && assignFolder(page.id, newFolderInput.trim())}
                      className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </td>
        <td className="px-4 py-4 text-gray-700 text-sm">
          {page.template?.name || 'Custom HTML'}
        </td>
        <td className="px-4 py-4 text-right font-medium text-gray-900">{stats.views}</td>
        <td className="px-4 py-4 text-right font-medium">
          <button
            onClick={() => handleShowLeads(page.id, page.name)}
            className="text-purple-600 hover:text-purple-800 hover:underline"
          >
            {stats.conversions}
          </button>
        </td>
        <td className="px-4 py-4 text-right font-medium text-gray-900">{getConversionRate(page)}</td>
        <td className="px-4 py-4">
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(`${window.location.origin}/p/${page.slug}`)}
            >
              <Copy className="w-4 h-4 mr-1" /> Copy
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
  };

  const renderFolderSection = (folderKey: string) => {
    const pages = groupedPages[folderKey];
    if (!pages || pages.length === 0) return null;

    const isUncategorized = folderKey === UNCATEGORIZED;
    const isCollapsed = collapsedFolders.has(folderKey);

    return (
      <div key={folderKey} className="mb-4">
        {/* Folder header row */}
        <div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg cursor-pointer select-none border ${
            isUncategorized
              ? 'bg-gray-50 text-gray-600 border-gray-200'
              : 'bg-purple-50 text-purple-800 border-purple-200'
          }`}
          onClick={() => toggleFolder(folderKey)}
        >
          {isCollapsed
            ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
            : <ChevronDown className="w-4 h-4 flex-shrink-0" />
          }
          {isUncategorized
            ? <Folder className="w-4 h-4 text-gray-400" />
            : <FolderOpen className="w-4 h-4 text-purple-500" />
          }

          {!isUncategorized && renamingFolder === folderKey ? (
            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') renameFolder(folderKey, renameValue);
                  if (e.key === 'Escape') setRenamingFolder(null);
                }}
                className="flex-1 px-2 py-0.5 text-sm border border-purple-300 rounded focus:ring-1 focus:ring-purple-400 focus:outline-none bg-white"
              />
              <button onClick={() => renameFolder(folderKey, renameValue)} className="p-1 text-green-600 hover:text-green-800">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setRenamingFolder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="font-semibold text-sm flex-1">
              {isUncategorized ? 'Uncategorized' : folderKey}
            </span>
          )}

          <span className="text-xs font-normal opacity-60">
            {pages.length} page{pages.length !== 1 ? 's' : ''}
          </span>

          {!isUncategorized && renamingFolder !== folderKey && (
            <button
              onClick={e => {
                e.stopPropagation();
                setRenamingFolder(folderKey);
                setRenameValue(folderKey);
              }}
              className="p-1 text-purple-400 hover:text-purple-700 rounded ml-1"
              title="Rename folder"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Table */}
        {!isCollapsed && (
          <div className="overflow-x-auto border border-t-0 border-gray-200 rounded-b-lg">
            <table className="w-full min-w-[1050px] text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 uppercase text-xs">Page</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 uppercase text-xs">Slug</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 uppercase text-xs">Linked Webinar</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 uppercase text-xs">Folder</th>
                  <th className="px-4 py-2.5 text-left font-medium text-gray-500 uppercase text-xs">Template</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500 uppercase text-xs">Views</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500 uppercase text-xs">Conv</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500 uppercase text-xs">Conv %</th>
                  <th className="px-4 py-2.5 text-right font-medium text-gray-500 uppercase text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pages.map(renderPageRow)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const foldersToRender = [
    ...allFolders,
    ...(groupedPages[UNCATEGORIZED]?.length > 0 ? [UNCATEGORIZED] : [])
  ];

  return (
    <DashboardLayout>
      {/* Header */}
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

      {/* Filters bar */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        {/* Date filter */}
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
              {dateFilterOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => {
                    setDateFilter(option.value);
                    if (option.value !== 'custom') setShowDateDropdown(false);
                  }}
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
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
          </div>
        )}

        {/* Webinar filter */}
        {webinars.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600">Webinar:</label>
            <select
              value={webinarFilter}
              onChange={e => setWebinarFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-400 focus:outline-none"
            >
              <option value="all">All Webinars</option>
              {webinars.map(w => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>
        )}

        {(dateFilter !== 'all' || webinarFilter !== 'all') && (
          <button
            onClick={() => { setDateFilter('all'); setWebinarFilter('all'); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}

        <span className="text-sm text-gray-400 ml-auto">
          {leadPages.length} page{leadPages.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Content */}
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
        <div>
          {foldersToRender.map(renderFolderSection)}
        </div>
      )}

      {/* Leads Modal */}
      {leadsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
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
            <div className="flex-1 overflow-auto">
              {leadsLoading ? (
                <div className="p-8 text-center text-gray-500">Loading leads...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p>No leads found for this page yet.</p>
                  <p className="text-xs mt-1">Leads appear here when people register through this page.</p>
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
                    {leads.map(lead => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">{lead.name}</td>
                        <td className="px-6 py-3 text-gray-600">{lead.email}</td>
                        <td className="px-6 py-3 text-center">
                          {lead.attended ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Yes</span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">No</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right text-gray-500">
                          {new Date(lead.registeredAt).toLocaleDateString()}
                          <span className="text-xs ml-1 text-gray-400">
                            {new Date(lead.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <span className="text-xs text-gray-500">Total Leads: {leads.length}</span>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

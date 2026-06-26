'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Plus, Edit, Trash2, ExternalLink, Copy, Users, Calendar, Clock,
  ChevronDown, ChevronRight, Folder, FolderOpen, Pencil,
  Check, X, FlaskConical, Search, ArrowUpDown, List, FolderTree,
  LayoutGrid, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

type DateFilterType = 'all' | 'last1h' | 'last24h' | 'today' | 'last7d' | 'last30d' | 'custom';
type SortKey = 'name' | 'created' | 'views' | 'conversions' | 'convRate';
type SortDir = 'asc' | 'desc';
type ViewMode = 'tiles' | 'folders' | 'flat';
type SearchField = 'all' | 'name' | 'slug' | 'folder';

const searchFieldOptions: { value: SearchField; label: string }[] = [
  { value: 'all', label: 'All fields' },
  { value: 'name', label: 'Page name' },
  { value: 'slug', label: 'Slug' },
  { value: 'folder', label: 'Folder' },
];

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'created', label: 'Date created' },
  { value: 'name', label: 'Name' },
  { value: 'views', label: 'Views' },
  { value: 'conversions', label: 'Conversions' },
  { value: 'convRate', label: 'Conversion rate' },
];

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

  // Search / sort / view
  const [searchQuery, setSearchQuery] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('tiles');
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Tiles (Finder-style) navigation: which folder is currently "opened" (null = root grid)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);

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
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Persist preferences
  useEffect(() => {
    try {
      const saved = localStorage.getItem('leadPagesPrefs_v2');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.sortKey) setSortKey(p.sortKey);
        if (p.sortDir) setSortDir(p.sortDir);
        if (p.viewMode) setViewMode(p.viewMode);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('leadPagesPrefs_v2', JSON.stringify({ sortKey, sortDir, viewMode }));
    } catch {}
  }, [sortKey, sortDir, viewMode]);

  // Auto-switch to flat view while searching ONLY for the collapsible Sections view
  // (collapsed sections would otherwise hide matches). Tiles searches in place; List is
  // already flat. Restore Sections when the search is cleared.
  const searchAutoFlatRef = useRef(false);
  useEffect(() => {
    if (searchQuery.trim()) {
      if (viewMode === 'folders') {
        setViewMode('flat');
        searchAutoFlatRef.current = true;
      }
    } else if (searchAutoFlatRef.current) {
      setViewMode('folders');
      searchAutoFlatRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

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

  // --- Search / sort ---
  const statsFor = (p: any) => {
    if (dateFilter !== 'all' && p.filteredViews !== undefined) {
      return { views: p.filteredViews ?? 0, conversions: p.filteredConversions ?? 0 };
    }
    return { views: p.views ?? 0, conversions: p.conversions ?? 0 };
  };

  // Page-level search, honoring the selected field (All / Name / Slug)
  const matchesSearch = (p: any) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    if (searchField === 'name') return (p.name || '').toLowerCase().includes(q);
    if (searchField === 'slug') return (p.slug || '').toLowerCase().includes(q);
    if (searchField === 'folder') return (p.folder || '').toLowerCase().includes(q);
    const haystack = [
      p.name,
      p.slug,
      p.folder,
      p.template?.name,
      p.webinar?.internalName,
      p.webinar?.title,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(q);
  };

  // Folder-name search at the Tiles root — only filters folders when the user has
  // explicitly chosen to search by "Folder"; page-field searches don't narrow folders.
  const folderMatchesSearch = (folderName: string) => {
    if (searchField !== 'folder') return true;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return folderName.toLowerCase().includes(q);
  };

  const compareFn = (a: any, b: any) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    let av: any, bv: any;
    switch (sortKey) {
      case 'name':
        av = (a.name || '').toLowerCase();
        bv = (b.name || '').toLowerCase();
        return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
      case 'views':
        return (statsFor(a).views - statsFor(b).views) * dir;
      case 'conversions':
        return (statsFor(a).conversions - statsFor(b).conversions) * dir;
      case 'convRate': {
        const ar = statsFor(a).views ? statsFor(a).conversions / statsFor(a).views : 0;
        const br = statsFor(b).views ? statsFor(b).conversions / statsFor(b).views : 0;
        return (ar - br) * dir;
      }
      case 'created':
      default: {
        const ad = new Date(a.createdAt || 0).getTime();
        const bd = new Date(b.createdAt || 0).getTime();
        return (ad - bd) * dir;
      }
    }
  };

  // All pages sorted (no search filter) — basis for the Tiles view
  const sortedPages = leadPages.slice().sort(compareFn);

  // Page-search-filtered set — used by the List and Sections views
  const visiblePages = sortedPages.filter(matchesSearch);

  // Every folder name that exists, regardless of search — used by the move picker
  // and the Tiles root grid (so all folders stay reachable while searching pages).
  const allFolderNames = Array.from(
    new Set(leadPages.map(p => p.folder).filter(Boolean))
  ).sort() as string[];
  const hasFolders = allFolderNames.length > 0;

  // --- Derived folder structure for the Sections view (from filtered+sorted set) ---
  const allFolders = Array.from(
    new Set(visiblePages.map(p => p.folder).filter(Boolean))
  ).sort() as string[];

  const groupedPages: Record<string, any[]> = {};
  for (const folder of allFolders) {
    groupedPages[folder] = visiblePages.filter(p => p.folder === folder);
  }
  groupedPages[UNCATEGORIZED] = visiblePages.filter(p => !p.folder);

  // --- Tiles grouping: all pages (search applied per-context at render) ---
  const tilesGrouped: Record<string, any[]> = {};
  for (const folder of allFolderNames) {
    tilesGrouped[folder] = sortedPages.filter(p => p.folder === folder);
  }
  tilesGrouped[UNCATEGORIZED] = sortedPages.filter(p => !p.folder);

  // Folders shown at the Tiles root (folder-name search applies here)
  const tilesRootFolders = allFolderNames.filter(folderMatchesSearch);
  const tilesShowUncat =
    (tilesGrouped[UNCATEGORIZED]?.length || 0) > 0 && folderMatchesSearch('Uncategorized');

  // Pages shown inside the currently-opened folder (page search applies here;
  // the "Folder" field is a no-op inside a folder, so it shows everything).
  const currentFolderPages = currentFolder
    ? (tilesGrouped[currentFolder] || []).filter(p => searchField === 'folder' ? true : matchesSearch(p))
    : [];

  // At the Tiles root, a page-field search (Name/Slug/All) with a query shows a flat
  // grid of matching pages across all folders instead of the folder grid.
  const tilesRootShowingPages =
    viewMode === 'tiles' && !currentFolder && hasFolders &&
    searchField !== 'folder' && !!searchQuery.trim();

  // Open/close a folder in Tiles view; clear the search so a folder-name query
  // doesn't silently carry over into the page search (and vice versa). The "Folder"
  // field isn't offered inside a folder, so fall back to "All fields" there.
  const navigateToFolder = (folder: string | null) => {
    setSearchQuery('');
    if (folder && searchField === 'folder') setSearchField('all');
    setCurrentFolder(folder);
  };

  const toggleFolder = (folder: string) => {
    setCollapsedFolders(prev => {
      const s = new Set(prev);
      s.has(folder) ? s.delete(folder) : s.add(folder);
      return s;
    });
  };

  // Reusable "Move to folder" picker (used in table rows and in tiles)
  const renderFolderPicker = (page: any, align: 'left' | 'right' = 'left') => {
    const isPickerOpen = folderPickerPageId === page.id;
    return (
      <div className="relative inline-block" ref={isPickerOpen ? folderPickerRef : undefined}>
        <button
          onClick={() => {
            setFolderPickerPageId(isPickerOpen ? null : page.id);
            setNewFolderInput('');
          }}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors max-w-[150px] ${
            page.folder
              ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          <Folder className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{page.folder || 'No folder'}</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </button>

        {isPickerOpen && (
          <div className={`absolute z-30 top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-1 w-52 bg-white rounded-lg shadow-xl border border-gray-200 py-1`}>
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
            {allFolderNames.filter(f => f !== page.folder).map(folder => (
              <button
                key={folder}
                onClick={() => assignFolder(page.id, folder)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 text-gray-700 flex items-center gap-2"
              >
                <Folder className="w-3.5 h-3.5 text-purple-400" />
                <span className="truncate">{folder}</span>
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
    );
  };

  const renderPageRow = (page: any) => {
    const stats = getDisplayStats(page);

    return (
      <tr key={page.id} className="hover:bg-gray-50">
        <td className="px-4 py-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900">{page.name}</span>
            {page.isActiveABTest && (
              <div 
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider cursor-help w-max"
                title="Currently active in a Split Test"
              >
                <FlaskConical className="w-3 h-3" />
                In Split Test
              </div>
            )}
          </div>
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
          {renderFolderPicker(page, 'left')}
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

  // --- Tiles (Finder-style) renderers ---

  const renderPageTile = (page: any) => {
    const stats = getDisplayStats(page);
    return (
      <div
        key={page.id}
        className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all p-4 flex flex-col"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/dashboard/lead-pages/${page.id}`}
              className="block font-semibold text-gray-900 hover:text-purple-700 truncate"
            >
              {page.name}
            </Link>
            <code className="text-[11px] font-mono text-purple-600">/p/{page.slug}</code>
          </div>
          {page.isActiveABTest && (
            <div
              className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-600 text-[9px] font-bold uppercase tracking-wider"
              title="Currently active in a Split Test"
            >
              <FlaskConical className="w-2.5 h-2.5" /> Test
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-500 space-y-0.5">
          <div className="truncate">
            <span className="text-gray-400">Webinar:</span>{' '}
            {page.webinar ? (page.webinar.internalName || page.webinar.title) : <span className="italic text-gray-400">None</span>}
          </div>
          <div className="truncate">
            <span className="text-gray-400">Template:</span> {page.template?.name || 'Custom HTML'}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-2 text-center">
          <div>
            <div className="text-sm font-semibold text-gray-900">{stats.views}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Views</div>
          </div>
          <button
            onClick={() => handleShowLeads(page.id, page.name)}
            className="rounded hover:bg-purple-50 transition-colors"
            title="View leads"
          >
            <div className="text-sm font-semibold text-purple-600">{stats.conversions}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Leads</div>
          </button>
          <div>
            <div className="text-sm font-semibold text-gray-900">{getConversionRate(page)}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Rate</div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
          {renderFolderPicker(page, 'left')}
          <div className="ml-auto flex items-center gap-0.5">
            <button
              onClick={() => copyToClipboard(`${window.location.origin}/p/${page.slug}`)}
              title="Copy link"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <Copy className="w-4 h-4" />
            </button>
            <a
              href={`/p/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open page"
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href={`/dashboard/lead-pages/${page.id}`}
              title="Edit"
              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-700 hover:bg-purple-50"
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={() => handleDelete(page.id, page.name)}
              title="Delete"
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderFolderTile = (folderKey: string) => {
    const pages = tilesGrouped[folderKey] || [];
    const isUncat = folderKey === UNCATEGORIZED;
    const isRenaming = renamingFolder === folderKey;
    const totals = pages.reduce(
      (acc, p) => {
        const s = getDisplayStats(p);
        acc.views += s.views || 0;
        acc.conversions += s.conversions || 0;
        return acc;
      },
      { views: 0, conversions: 0 }
    );

    return (
      <div key={folderKey} className="group relative">
        <div
          role="button"
          tabIndex={0}
          onClick={() => { if (!isRenaming) navigateToFolder(folderKey); }}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !isRenaming) navigateToFolder(folderKey); }}
          className="cursor-pointer bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
              isUncat ? 'bg-gray-100' : 'bg-purple-50 group-hover:bg-purple-100'
            }`}>
              <Folder className={`w-6 h-6 ${isUncat ? 'text-gray-400' : 'text-purple-500'}`} />
            </div>
            <span className="text-xs font-medium text-gray-400">
              {pages.length} page{pages.length !== 1 ? 's' : ''}
            </span>
          </div>

          {isRenaming ? (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <input
                autoFocus
                type="text"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') renameFolder(folderKey, renameValue);
                  if (e.key === 'Escape') setRenamingFolder(null);
                }}
                className="flex-1 min-w-0 px-2 py-0.5 text-sm border border-purple-300 rounded focus:ring-1 focus:ring-purple-400 focus:outline-none bg-white"
              />
              <button onClick={() => renameFolder(folderKey, renameValue)} className="p-1 text-green-600 hover:text-green-800">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setRenamingFolder(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="font-semibold text-gray-900 truncate">
              {isUncat ? 'Uncategorized' : folderKey}
            </h3>
          )}

          <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
            <span>{totals.views} views</span>
            <span>{totals.conversions} leads</span>
          </div>
        </div>

        {!isUncat && !isRenaming && (
          <button
            onClick={e => {
              e.stopPropagation();
              setRenamingFolder(folderKey);
              setRenameValue(folderKey);
            }}
            className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-300 hover:text-purple-600 hover:bg-purple-50 opacity-0 group-hover:opacity-100 transition"
            title="Rename folder"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  const foldersToRender = [
    ...allFolders,
    ...(groupedPages[UNCATEGORIZED]?.length > 0 ? [UNCATEGORIZED] : [])
  ];

  // --- Search UI labels ---
  const currentFolderLabel = currentFolder === UNCATEGORIZED ? 'Uncategorized' : currentFolder;
  const insideFolder = viewMode === 'tiles' && !!currentFolder;
  const searchPlaceholder = insideFolder
    ? (searchField === 'slug'
        ? `Search slugs in "${currentFolderLabel}"…`
        : searchField === 'name'
          ? `Search names in "${currentFolderLabel}"…`
          : `Search pages in "${currentFolderLabel}"…`)
    : searchField === 'folder'
      ? 'Search folders by name…'
      : searchField === 'name'
        ? 'Search pages by name…'
        : searchField === 'slug'
          ? 'Search pages by slug…'
          : 'Search pages by name, slug, webinar, or template…';

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

      {/* Search bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-9 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 focus:border-purple-300 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* "Search by" field selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label htmlFor="search-by" className="text-sm text-gray-500 whitespace-nowrap hidden sm:inline">
            Search by
          </label>
          <select
            id="search-by"
            value={searchField}
            onChange={e => setSearchField(e.target.value as SearchField)}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 focus:ring-2 focus:ring-purple-400 focus:outline-none"
            title="Choose what to search by"
          >
            {searchFieldOptions
              .filter(opt => !(insideFolder && opt.value === 'folder'))
              .map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
          </select>
        </div>
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

        {/* Sort */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            onClick={() => setShowSortDropdown(s => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowUpDown className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">
              Sort: {sortOptions.find(o => o.value === sortKey)?.label} ({sortDir === 'asc' ? '↑' : '↓'})
            </span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {showSortDropdown && (
            <div className="absolute z-20 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (sortKey === opt.value) {
                      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortKey(opt.value);
                      setSortDir(opt.value === 'name' ? 'asc' : 'desc');
                    }
                    setShowSortDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex justify-between items-center ${
                    sortKey === opt.value ? 'bg-purple-50 text-purple-700 font-medium' : 'text-gray-700'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortKey === opt.value && (
                    <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* View toggle */}
        <div className="inline-flex bg-white border border-gray-200 rounded-lg p-0.5">
          <button
            onClick={() => { searchAutoFlatRef.current = false; setViewMode('tiles'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'tiles' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Browse folders as tiles"
          >
            <LayoutGrid className="w-4 h-4" /> Tiles
          </button>
          <button
            onClick={() => { searchAutoFlatRef.current = false; setViewMode('folders'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'folders' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Group by folder"
          >
            <FolderTree className="w-4 h-4" /> Sections
          </button>
          <button
            onClick={() => { searchAutoFlatRef.current = false; setViewMode('flat'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
              viewMode === 'flat' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}
            title="Flat list"
          >
            <List className="w-4 h-4" /> List
          </button>
        </div>

        {(dateFilter !== 'all' || webinarFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => { setDateFilter('all'); setWebinarFilter('all'); setSearchQuery(''); }}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Clear filters
          </button>
        )}

        <span className="text-sm text-gray-400 ml-auto">
          {viewMode === 'tiles' && !currentFolder && !tilesRootShowingPages && hasFolders ? (
            (() => {
              const shown = tilesRootFolders.length + (tilesShowUncat ? 1 : 0);
              const total = allFolderNames.length + ((tilesGrouped[UNCATEGORIZED]?.length || 0) > 0 ? 1 : 0);
              return `${searchField === 'folder' && searchQuery ? `${shown} of ${total}` : total} folder${total !== 1 ? 's' : ''}`;
            })()
          ) : insideFolder ? (
            `${currentFolderPages.length} page${currentFolderPages.length !== 1 ? 's' : ''}`
          ) : (
            `${searchQuery || dateFilter !== 'all' || webinarFilter !== 'all'
              ? `${visiblePages.length} of ${leadPages.length}`
              : `${leadPages.length}`} page${leadPages.length !== 1 ? 's' : ''}`
          )}
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
      ) : viewMode === 'tiles' ? (
        <div>
          {currentFolder ? (
            /* Inside a folder — search is scoped to this folder's pages */
            <>
              <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
                <button
                  onClick={() => navigateToFolder(null)}
                  className="flex items-center gap-1 text-gray-500 hover:text-purple-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> All Pages
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-purple-500" />
                  {currentFolderLabel}
                </span>
                <span className="text-gray-400">
                  · {currentFolderPages.length} page{currentFolderPages.length !== 1 ? 's' : ''}
                </span>
              </div>
              {currentFolderPages.length === 0 ? (
                <Card className="p-8 text-center">
                  {searchQuery ? (
                    <>
                      <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-600 font-medium mb-1">No pages match your search in this folder</p>
                      <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-purple-600 hover:underline">
                        Clear search
                      </button>
                    </>
                  ) : (
                    <>
                      <Folder className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">This folder is empty.</p>
                      <button onClick={() => navigateToFolder(null)} className="mt-3 text-sm text-purple-600 hover:underline">
                        ← Back to all pages
                      </button>
                    </>
                  )}
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {currentFolderPages.map(renderPageTile)}
                </div>
              )}
            </>
          ) : !hasFolders ? (
            /* No folders yet — show all pages directly as tiles (page search applies) */
            visiblePages.length === 0 ? (
              <Card className="p-8 text-center">
                <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 font-medium mb-1">No pages match your search</p>
                <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-purple-600 hover:underline">
                  Clear search
                </button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {visiblePages.map(renderPageTile)}
              </div>
            )
          ) : tilesRootShowingPages ? (
            /* Root page search — flat results across all folders */
            <>
              <div className="flex items-center gap-2 mb-4 text-sm flex-wrap">
                <button
                  onClick={() => setSearchQuery('')}
                  className="flex items-center gap-1 text-gray-500 hover:text-purple-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> All Folders
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-purple-500" />
                  Search results
                </span>
                <span className="text-gray-400">
                  · {visiblePages.length} page{visiblePages.length !== 1 ? 's' : ''}
                </span>
              </div>
              {visiblePages.length === 0 ? (
                <Card className="p-8 text-center">
                  <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium mb-1">No pages match your search</p>
                  <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-purple-600 hover:underline">
                    Clear search
                  </button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {visiblePages.map(renderPageTile)}
                </div>
              )}
            </>
          ) : tilesRootFolders.length === 0 && !tilesShowUncat ? (
            /* Root folder search with no matches */
            <Card className="p-8 text-center">
              <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium mb-1">No folders match your search</p>
              <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-purple-600 hover:underline">
                Clear search
              </button>
            </Card>
          ) : (
            /* Root — folder grid (folder-name search applies) */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {tilesRootFolders.map(renderFolderTile)}
              {tilesShowUncat && renderFolderTile(UNCATEGORIZED)}
            </div>
          )}
        </div>
      ) : visiblePages.length === 0 ? (
        <Card className="p-8 text-center">
          <Search className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium mb-1">No pages match your search</p>
          <p className="text-sm text-gray-500 mb-4">Try a different keyword or clear the filters.</p>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setDateFilter('all'); setWebinarFilter('all'); }}>
            Clear filters
          </Button>
        </Card>
      ) : viewMode === 'flat' ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
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
              {visiblePages.map(renderPageRow)}
            </tbody>
          </table>
        </div>
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

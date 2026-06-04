'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Monitor, Smartphone, RefreshCw } from 'lucide-react';

type PreviewDevice = 'desktop' | 'mobile';

interface LeadPagePreviewProps {
  /** Raw custom HTML the user is editing */
  html: string;
  /** Optional debounce in ms before the iframe re-renders (default 400) */
  debounceMs?: number;
}

/**
 * Live, sandboxed preview of custom lead-page HTML.
 * Re-renders (debounced) as the user types so they can see their changes.
 */
export default function LeadPagePreview({ html, debounceMs = 400 }: LeadPagePreviewProps) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [debouncedHtml, setDebouncedHtml] = useState(html);
  // Bumping this key forces the iframe to remount on manual refresh.
  const [refreshKey, setRefreshKey] = useState(0);
  const isFirst = useRef(true);

  useEffect(() => {
    // Render immediately on first mount, debounce subsequent edits.
    if (isFirst.current) {
      isFirst.current = false;
      setDebouncedHtml(html);
      return;
    }
    const t = setTimeout(() => setDebouncedHtml(html), debounceMs);
    return () => clearTimeout(t);
  }, [html, debounceMs]);

  const hasContent = html.trim().length > 0;

  const frameWidth = device === 'mobile' ? 390 : '100%';

  const srcDoc = useMemo(() => debouncedHtml, [debouncedHtml]);

  return (
    <div className="mt-4 border rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Eye className="w-4 h-4 text-purple-600" />
          Live Preview
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-white border border-gray-200 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                device === 'desktop' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Desktop view"
            >
              <Monitor className="w-3.5 h-3.5" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                device === 'mobile' ? 'bg-purple-100 text-purple-700 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Mobile view"
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile
            </button>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-1.5 text-gray-500 hover:text-purple-600 rounded hover:bg-gray-100"
            title="Refresh preview"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame */}
      <div className="bg-gray-100 p-3 flex justify-center">
        {hasContent ? (
          <div
            className="bg-white shadow-sm rounded-md overflow-hidden transition-all"
            style={{ width: frameWidth, maxWidth: '100%' }}
          >
            <iframe
              key={`${device}-${refreshKey}`}
              title="Lead page live preview"
              srcDoc={srcDoc}
              className="w-full h-[480px] border-0"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="h-[200px] w-full flex flex-col items-center justify-center text-center text-gray-400">
            <Eye className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-sm">Paste HTML above to see a live preview here.</p>
          </div>
        )}
      </div>
      <p className="px-3 py-2 text-xs text-gray-400 border-t bg-gray-50">
        Preview shows your raw HTML. The registration modal logic is injected automatically on the published page.
      </p>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, ExternalLink, Copy } from 'lucide-react';
import Link from 'next/link';

export default function LeadPagesDashboard() {
  const router = useRouter();
  const [leadPages, setLeadPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadPages();
  }, []);

  const fetchLeadPages = async () => {
    try {
      const res = await fetch('/api/lead-pages');
      if (res.ok) {
        setLeadPages(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch lead pages', error);
    } finally {
      setLoading(false);
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

      {loading ? (
        <div>Loading...</div>
      ) : leadPages.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">No lead pages found. Create your first one!</p>
          <Link href="/dashboard/lead-pages/new">
            <Button>Create Lead Page</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leadPages.map((page) => (
            <Card key={page.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{page.name}</h3>
                  <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block text-purple-600">
                    /p/{page.slug}
                  </div>
                </div>
                <div className="flex gap-1">
                   {/* Delete button logic needed */}
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Linked Webinar:</span>
                  <span className="font-medium text-gray-900 truncate max-w-[150px]">{page.webinar?.title || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Template:</span>
                  <span className="font-medium text-gray-900">{page.template?.name || 'Custom HTML'}</span>
                </div>
                <div className="flex justify-between pt-2 border-t mt-2">
                  <span>Views / Conv:</span>
                  <span className="font-bold text-gray-900">{page.views} / {page.conversions}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                   variant="outline" 
                   size="sm" 
                   className="flex-1"
                   onClick={() => copyToClipboard(`${window.location.origin}/p/${page.slug}`)}
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Link
                </Button>
                <a 
                  href={`/p/${page.slug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 border rounded-md hover:bg-gray-50 text-gray-600"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

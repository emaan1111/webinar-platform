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

  useEffect(() => {
    fetchSplitTests();
  }, [timeRange]);

  const fetchSplitTests = async () => {
    setLoading(true);
    try {
      let url = '/api/split-tests';
      
      if (timeRange !== 'all') {
        const now = new Date();
        let fromDate = new Date();
        
        switch(timeRange) {
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
        }
        
        url += `?from=${fromDate.toISOString()}`;
      }
      
      const res = await fetch(url);
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
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-xl">{test.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${test.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {test.isActive ? 'ACTIVE' : 'PAUSED'}
                        </span>
                    </div>
                    <div className="text-sm font-mono text-purple-600 mt-1">/t/{test.slug}</div>
                 </div>
                 <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/t/${test.slug}`)}>
                       <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(test.id)}>
                       <Trash2 className="w-4 h-4" />
                    </Button>
                 </div>
              </div>

              {/* Variants List */}
              <div className="space-y-4">
                 <div className="grid grid-cols-12 text-xs font-bold text-gray-500 uppercase pb-2 border-b">
                     <div className="col-span-4">Variant Page</div>
                     <div className="col-span-2 text-center">Weight</div>
                     <div className="col-span-2 text-center">Visitors</div>
                     <div className="col-span-2 text-center">Conversions</div>
                     <div className="col-span-2 text-right">Conv. Rate</div>
                 </div>
                 
                 {test.variants.map((v: any) => {
                    // Conversion Rate based on UNIQUE views and UNIQUE conversions
                    const uniqueViews = v.uniqueViews || 0;
                    const uniqueConversions = v.uniqueConversions || 0;
                    const conversionRate = uniqueViews > 0 ? ((uniqueConversions / uniqueViews) * 100).toFixed(1) : 0;
                    
                    return (
                        <div key={v.id} className="grid grid-cols-12 items-center text-sm py-2 border-b last:border-0 hover:bg-gray-50">
                            <div className="col-span-4 font-medium flex items-center gap-2 overflow-hidden">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${v.weight > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
                                <span className="truncate" title={v.leadPage.name}>{v.leadPage.name}</span>
                            </div>
                            <div className="col-span-2 text-center text-gray-500">
                                {v.weight}%
                            </div>
                            <div className="col-span-2 text-center">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900">{uniqueViews}</span>
                                    <span className="text-[10px] text-gray-400">Unique</span>
                                    {/* Optional: Show total in tooltip or small text */}
                                    <span className="text-[10px] text-gray-300">({v.views} Total)</span>
                                </div>
                            </div>
                            <div className="col-span-2 text-center">
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900">{uniqueConversions}</span>
                                    <span className="text-[10px] text-gray-400">Unique</span>
                                    <span className="text-[10px] text-gray-300">({v.conversions} Total)</span>
                                </div>
                            </div>
                            <div className="col-span-2 text-right">
                                <div className="flex flex-col items-end">
                                    <span className={`font-bold text-lg ${Number(conversionRate) > 20 ? 'text-green-600' : Number(conversionRate) > 10 ? 'text-blue-600' : 'text-gray-800'}`}>
                                        {conversionRate}%
                                    </span>
                                    <span className="text-[10px] text-gray-400">from uniques</span>
                                </div>
                            </div>
                        </div>
                    );
                 })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

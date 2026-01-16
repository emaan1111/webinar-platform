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
                       <Copy className="w-4 h-4 mr-2" /> Link
                    </Button>
                 </div>
              </div>

              {/* Variants List */}
              <div className="space-y-4">
                 <div className="grid grid-cols-12 text-xs font-bold text-gray-500 uppercase pb-2 border-b">
                     <div className="col-span-5">Variant Page</div>
                     <div className="col-span-2 text-center">Weight</div>
                     <div className="col-span-5 text-right">Performance</div>
                 </div>
                 
                 {test.variants.map((v: any) => {
                    const conversionRate = v.views > 0 ? ((v.conversions / v.views) * 100).toFixed(1) : 0;
                    return (
                        <div key={v.id} className="grid grid-cols-12 items-center text-sm py-2 border-b last:border-0">
                            <div className="col-span-5 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                {v.leadPage.name}
                            </div>
                            <div className="col-span-2 text-center text-gray-500">
                                {v.weight}%
                            </div>
                            <div className="col-span-5 text-right flex items-center justify-end gap-4">
                                <div>
                                    <span className="block font-bold text-gray-900">{v.views}</span>
                                    <span className="text-xs text-gray-400">Views</span>
                                </div>
                                <div className="w-px h-8 bg-gray-100 mx-1"></div>
                                <div>
                                    <span className="block font-bold text-gray-900">{v.conversions}</span>
                                    <span className="text-xs text-gray-400">Conversions</span>
                                </div>
                                <div className="w-px h-8 bg-gray-100 mx-1"></div>
                                <div>
                                    <span className="block font-bold text-green-600">{conversionRate}%</span>
                                    <span className="text-xs text-gray-400">Conv. Rate</span>
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

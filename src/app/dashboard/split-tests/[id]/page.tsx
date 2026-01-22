'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, RefreshCw, Calendar, Edit, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export default function SplitTestDetails() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (id) {
      fetchAnalytics();
    }
  }, [id, timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/split-tests/${id}/analytics?range=${timeRange}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetStats = async () => {
    if (!confirm('Are you sure you want to reset all stats for this split test? This will reset views, conversions, and delete all tracking events. This cannot be undone.')) {
      return;
    }
    
    setResetting(true);
    try {
      const res = await fetch(`/api/split-tests/${id}/reset-stats`, {
        method: 'POST'
      });
      
      if (res.ok) {
        alert('Stats have been reset successfully');
        fetchAnalytics();
      } else {
        alert('Failed to reset stats');
      }
    } catch (error) {
      console.error('Failed to reset stats', error);
      alert('Failed to reset stats');
    } finally {
      setResetting(false);
    }
  };

  if (loading && !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const { test, chartData } = data;
  const variants = test.variants;

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </Button>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.name}</h1>
            <p className="text-gray-500">Split Test Analytics</p>
          </div>
            <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleResetStats}
              disabled={resetting}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> 
              {resetting ? 'Resetting...' : 'Reset Stats'}
            </Button>
            <Link href={`/dashboard/split-tests/${id}/edit`}>
              <Button variant="secondary" size="sm">
                <Edit className="w-4 h-4 mr-2" /> Edit Test
              </Button>
            </Link>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
            <Button variant="outline" size="sm" onClick={fetchAnalytics}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Views Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Views by Time</h2>
            <p className="text-sm text-gray-500">Traffic distribution across variants</p>
          </CardHeader>
          <CardBody>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (timeRange === '1h' || timeRange === '24h') {
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Legend />
                  {variants.map((variant: any, index: number) => (
                    <Line
                      key={variant.id}
                      type="monotone"
                      dataKey={`${variant.id}_views`}
                      name={`${variant.leadPage?.name || 'Variant ' + (index + 1)} Views`}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Conversions Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Conversions by Time</h2>
            <p className="text-sm text-gray-500">Successful conversions across variants</p>
          </CardHeader>
          <CardBody>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (timeRange === '1h' || timeRange === '24h') {
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                     labelFormatter={(value) => new Date(value).toLocaleString()}
                  />
                  <Legend />
                  {variants.map((variant: any, index: number) => (
                    <Line
                      key={variant.id}
                      type="monotone"
                      dataKey={`${variant.id}_conversions`}
                      name={`${variant.leadPage?.name || 'Variant ' + (index + 1)} Conversions`}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        {/* Conversion Rate Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Conversion Rate (%) by Time</h2>
            <p className="text-sm text-gray-500">Performance efficiency trend</p>
          </CardHeader>
          <CardBody>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (timeRange === '1h' || timeRange === '24h') {
                        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      }
                      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                    }}
                  />
                  <YAxis unit="%" padding={{ top: 20 }} domain={[0, 'auto']} />
                  <Tooltip 
                     labelFormatter={(value) => new Date(value).toLocaleString()}
                     formatter={(value: any) => [`${value}%`, 'Conversion Rate']}
                  />
                  <Legend />
                  {variants.map((variant: any, index: number) => (
                    <Line
                      key={variant.id}
                      type="monotone"
                      dataKey={`${variant.id}_rate`}
                      name={`${variant.leadPage?.name || 'Variant ' + (index + 1)} Rate`}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

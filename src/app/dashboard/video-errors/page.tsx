'use client';

import { useEffect, useState } from 'react';

interface VideoError {
  id: string;
  webinarId: string;
  registrationId: string | null;
  errorType: string;
  errorMessage: string;
  errorStack: string | null;
  userAgent: string;
  deviceInfo: string;
  createdAt: string;
  timestamp: string;
  viewer_name: string | null;
  viewer_email: string | null;
}

export default function VideoErrorsPage() {
  const [errors, setErrors] = useState<VideoError[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchErrors();
  }, []);

  const fetchErrors = async () => {
    try {
      const response = await fetch('/api/video-errors');
      if (response.ok) {
        const data = await response.json();
        setErrors(data.errors || []);
      }
    } catch (error) {
      console.error('Failed to fetch video errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredErrors = errors.filter((error) => {
    if (filter === 'all') return true;
    return error.errorType === filter;
  });

  const errorTypes = [...new Set(errors.map((e) => e.errorType))];

  const getDeviceInfo = (deviceInfoStr: string) => {
    try {
      const info = JSON.parse(deviceInfoStr);
      return {
        isMobile: info.isMobile ? '📱 Mobile' : '🖥️ Desktop',
        screen: `${info.screenWidth}×${info.screenHeight}`,
        platform: info.platform,
      };
    } catch {
      return { isMobile: '❓', screen: 'Unknown', platform: 'Unknown' };
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Video Error Logs</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Error Logs</h1>
        <p className="text-gray-600">
          Track and debug video playback issues across devices
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          All ({errors.length})
        </button>
        {errorTypes.map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {type} ({errors.filter((e) => e.errorType === type).length})
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Total Errors</div>
          <div className="text-2xl font-bold">{errors.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Mobile Errors</div>
          <div className="text-2xl font-bold">
            {
              errors.filter((e) => {
                try {
                  return JSON.parse(e.deviceInfo).isMobile;
                } catch {
                  return false;
                }
              }).length
            }
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Desktop Errors</div>
          <div className="text-2xl font-bold">
            {
              errors.filter((e) => {
                try {
                  return !JSON.parse(e.deviceInfo).isMobile;
                } catch {
                  return false;
                }
              }).length
            }
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Error Types</div>
          <div className="text-2xl font-bold">{errorTypes.length}</div>
        </div>
      </div>

      {/* Error List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredErrors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No errors found {filter !== 'all' && `for type "${filter}"`}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Viewer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Device
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredErrors.map((error) => {
                  const deviceInfo = getDeviceInfo(error.deviceInfo);
                  return (
                    <tr key={error.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(error.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {error.viewer_name ? (
                          <div>
                            <div className="font-medium text-gray-900">{error.viewer_name}</div>
                            <div className="text-xs text-gray-500">{error.viewer_email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Anonymous</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {error.errorType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div>{deviceInfo.isMobile}</div>
                        <div className="text-xs text-gray-500">
                          {deviceInfo.screen}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{error.errorMessage}</div>
                        {error.errorStack && (
                          <details className="mt-1">
                            <summary className="text-xs text-gray-500 cursor-pointer">
                              Stack trace
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                              {error.errorStack}
                            </pre>
                          </details>
                        )}
                        <div className="mt-1 text-xs text-gray-500 truncate">
                          {error.userAgent}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

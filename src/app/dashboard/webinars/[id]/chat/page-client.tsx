'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  id: string;
  message: string;
  videoTimestamp: number | null;
  isScripted: boolean;
  isApproved: boolean;
  isHidden: boolean;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
  } | null;
}

interface Props {
  webinarId: string;
  webinarTitle: string;
  initialMessages: ChatMessage[];
}

type StatusFilter = 'all' | 'scripted' | 'pending' | 'approved';

export default function ChatManagerClient({ webinarId, webinarTitle, initialMessages }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [csvContent, setCsvContent] = useState('');
  const [importing, setImporting] = useState(false);
  const [clearExisting, setClearExisting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const handleImport = async () => {
    if (!csvContent.trim()) {
      setError('Please paste CSV content');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/webinars/${webinarId}/chat/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          csvData: csvContent,
          clearExisting,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setSuccess(data.messages);
      setCsvContent('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const response = await fetch(`/api/webinars/${webinarId}/chat/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Delete failed');

      setMessages(messages.filter(m => m.id !== messageId));
      setSuccess('Message deleted');
    } catch (err) {
      setError('Failed to delete message');
    }
  };

  const handleApprove = async (messageId: string) => {
    try {
      const response = await fetch(`/api/webinars/${webinarId}/chat/${messageId}/approve`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Approval failed');

      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, isApproved: true, isHidden: false } : m
      ));
      setSuccess('Message approved');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to approve message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReject = async (messageId: string) => {
    if (!confirm('Reject this message? It will be hidden from viewers.')) return;

    try {
      const response = await fetch(`/api/webinars/${webinarId}/chat/${messageId}/reject`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Rejection failed');

      setMessages(messages.map(m => 
        m.id === messageId ? { ...m, isApproved: false, isHidden: true } : m
      ));
      setSuccess('Message rejected');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to reject message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const formatTimestamp = (seconds: number | null) => {
    if (seconds === null) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scriptedMessages = messages.filter(m => m.isScripted);
  const pendingMessages = messages.filter(m => !m.isScripted && !m.isApproved);
  const approvedMessages = messages.filter(m => !m.isScripted && m.isApproved);

  const statusOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: messages.length },
    { value: 'pending', label: 'Pending', count: pendingMessages.length },
    { value: 'approved', label: 'Approved', count: approvedMessages.length },
    { value: 'scripted', label: 'Scripted', count: scriptedMessages.length },
  ];

  const shouldShowScriptedSection = statusFilter === 'all' || statusFilter === 'scripted';
  const shouldShowPendingSection =
    statusFilter === 'pending' || (statusFilter === 'all' && pendingMessages.length > 0);
  const shouldShowApprovedSection =
    statusFilter === 'approved' || (statusFilter === 'all' && approvedMessages.length > 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Manager</h1>
          <p className="text-gray-600">{webinarTitle}</p>
          <div className="mt-4 flex gap-4 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <span className="font-semibold text-blue-900">{scriptedMessages.length}</span>
              <span className="text-blue-700 ml-2">Scripted Messages</span>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              <span className="font-semibold text-yellow-900">{pendingMessages.length}</span>
              <span className="text-yellow-700 ml-2">Pending Approval</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              <span className="font-semibold text-green-900">{approvedMessages.length}</span>
              <span className="text-green-700 ml-2">Approved Messages</span>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Filter by status</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                    statusFilter === option.value
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Chat from CSV</h2>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2 font-semibold">Supported CSV Formats:</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong>Format 1:</strong> <code className="bg-gray-100 px-2 py-1 rounded">timestamp,username,message</code>
              </p>
              <p className="text-xs text-gray-500 ml-4">
                Timestamp can be MM:SS (e.g., 1:30) or seconds (e.g., 90)
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Format 2:</strong> <code className="bg-gray-100 px-2 py-1 rounded">Hour,Minute,Second,Name,Message</code>
              </p>
              <p className="text-xs text-gray-500 ml-4">
                For exports with separate hour/minute/second columns
              </p>
            </div>
          </div>

          <textarea
            value={csvContent}
            onChange={(e) => setCsvContent(e.target.value)}
            placeholder="Format 1: timestamp,username,message&#10;0:15,Sarah,Hello everyone!&#10;1:30,Fatima,This is great!&#10;&#10;Format 2: Hour,Minute,Second,Name,Message&#10;0,0,15,Sarah,Hello everyone!&#10;0,1,30,Fatima,This is great!"
            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />

          <div className="mt-4 flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Clear existing scripted messages before import</span>
            </label>

            <button
              onClick={handleImport}
              disabled={importing || !csvContent.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {importing ? 'Importing...' : 'Import Messages'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}
        </div>

        {/* Scripted Messages */}
        {shouldShowScriptedSection && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Scripted Messages ({scriptedMessages.length})
            </h2>
            
            {scriptedMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scripted messages yet. Import from CSV above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scriptedMessages
                      .sort((a, b) => (a.videoTimestamp || 0) - (b.videoTimestamp || 0))
                      .map((msg) => (
                        <tr key={msg.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatTimestamp(msg.videoTimestamp)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                            {msg.user ? (msg.user.name || msg.user.email.split('@')[0]) : 'Unknown'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {msg.message}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <button
                              onClick={() => handleDelete(msg.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Pending Messages */}
        {shouldShowPendingSection && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Pending Approval ({pendingMessages.length})
            </h2>
            {pendingMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending messages right now.</p>
            ) : (
              <div className="space-y-3">
                {pendingMessages
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((msg) => (
                    <div key={msg.id} className="border-l-4 border-yellow-400 pl-4 py-3 bg-yellow-50">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-gray-900">
                            {msg.user ? (msg.user.name || msg.user.email) : 'Unknown User'}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          {msg.videoTimestamp && (
                            <span className="text-gray-500 text-sm ml-2">
                              at {formatTimestamp(msg.videoTimestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(msg.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(msg.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700">{msg.message}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Approved Messages */}
        {shouldShowApprovedSection && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Approved Messages ({approvedMessages.length})
            </h2>
            {approvedMessages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No approved messages yet.</p>
            ) : (
              <div className="space-y-3">
                {approvedMessages
                  .sort((a, b) => (a.videoTimestamp || 0) - (b.videoTimestamp || 0))
                  .map((msg) => (
                    <div key={msg.id} className="border-l-4 border-green-400 pl-4 py-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900">
                            {msg.user ? (msg.user.name || msg.user.email) : 'Unknown User'}
                          </span>
                          <span className="text-gray-500 text-sm ml-2">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                          {msg.videoTimestamp && (
                            <span className="text-gray-500 text-sm ml-2">
                              at {formatTimestamp(msg.videoTimestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(msg.id)}
                            className="text-yellow-600 hover:text-yellow-900 text-sm"
                          >
                            Unapprove
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-700 mt-1">{msg.message}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

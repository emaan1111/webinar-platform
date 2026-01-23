'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, Plus, Trash2, Video, Calendar, Users, 
  ExternalLink, Save, Clock, Mail 
} from 'lucide-react';
import Link from 'next/link';

interface EventSchedule {
  id: string;
  startTime: string;
  endTime?: string;
  timezone: string;
  zoomLink?: string;
  isActive: boolean;
  _count?: { registrations: number };
}

interface EventRegistration {
  id: string;
  name: string;
  email: string;
  phone?: string;
  registeredAt: string;
  attended: boolean;
  skippedWebinar: boolean;
  webinarRegistrationId?: string;
  eventSchedule: EventSchedule;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  zoomLink?: string;
  zoomMeetingId?: string;
  zoomPassword?: string;
  bundledWebinarId?: string;
  bundleDescription?: string;
  webinarOptional: boolean;
  maxAttendees?: number;
  requirePhone: boolean;
  confirmationEmailEnabled: boolean;
  reminderEmailEnabled: boolean;
  bundledWebinar?: {
    id: string;
    title: string;
    slug: string;
  };
  schedules: EventSchedule[];
  registrations: EventRegistration[];
  _count: { registrations: number };
}

interface Webinar {
  id: string;
  title: string;
  slug: string;
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'schedules' | 'registrations'>('details');

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    status: 'DRAFT',
    zoomLink: '',
    zoomMeetingId: '',
    zoomPassword: '',
    bundledWebinarId: '',
    bundleDescription: '',
    webinarOptional: true,
    maxAttendees: '',
    requirePhone: false,
    confirmationEmailEnabled: true,
    reminderEmailEnabled: true,
  });

  const [newSchedule, setNewSchedule] = useState({
    startTime: '',
    endTime: '',
    timezone: 'America/New_York',
    zoomLink: '',
  });

  useEffect(() => {
    fetchEvent();
    fetchWebinars();
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`/api/events/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data);
        setForm({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          status: data.status || 'DRAFT',
          zoomLink: data.zoomLink || '',
          zoomMeetingId: data.zoomMeetingId || '',
          zoomPassword: data.zoomPassword || '',
          bundledWebinarId: data.bundledWebinarId || '',
          bundleDescription: data.bundleDescription || '',
          webinarOptional: data.webinarOptional ?? true,
          maxAttendees: data.maxAttendees?.toString() || '',
          requirePhone: data.requirePhone ?? false,
          confirmationEmailEnabled: data.confirmationEmailEnabled ?? true,
          reminderEmailEnabled: data.reminderEmailEnabled ?? true,
        });
      }
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWebinars = async () => {
    try {
      const res = await fetch('/api/webinars');
      if (res.ok) {
        const data = await res.json();
        setWebinars(Array.isArray(data) ? data : data.webinars || []);
      }
    } catch (error) {
      console.error('Failed to fetch webinars:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setEvent({ ...event!, ...updated });
        alert('Event saved successfully');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save event');
      }
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const addSchedule = async () => {
    if (!newSchedule.startTime) {
      alert('Start time is required');
      return;
    }

    try {
      const res = await fetch(`/api/events/${params.id}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule),
      });

      if (res.ok) {
        const schedule = await res.json();
        setEvent({
          ...event!,
          schedules: [...event!.schedules, { ...schedule, _count: { registrations: 0 } }],
        });
        setNewSchedule({ startTime: '', endTime: '', timezone: 'America/New_York', zoomLink: '' });
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add schedule');
      }
    } catch (error) {
      console.error('Failed to add schedule:', error);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to remove this schedule?')) return;

    try {
      const res = await fetch(`/api/events/${params.id}/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setEvent({
          ...event!,
          schedules: event!.schedules.filter(s => s.id !== scheduleId),
        });
      }
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const formatDate = (dateStr: string, tz?: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz,
    });
  };

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'Europe/London', 'Europe/Paris', 'Asia/Dubai',
    'Asia/Karachi', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney',
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading event...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!event) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Event not found</p>
          <Link href="/dashboard/events" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Events
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/dashboard/events" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">/event/{event.slug}</span>
              <a
                href={`/event/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {(['details', 'schedules', 'registrations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium text-sm border-b-2 -mb-px capitalize ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
              {tab === 'registrations' && (
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                  {event._count.registrations}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Event Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL Slug</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-lg h-24"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Zoom Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Default Zoom Link</label>
                  <input
                    type="url"
                    className="w-full p-2 border rounded-lg"
                    value={form.zoomLink}
                    onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Meeting ID</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={form.zoomMeetingId}
                      onChange={(e) => setForm({ ...form, zoomMeetingId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Password</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded-lg"
                      value={form.zoomPassword}
                      onChange={(e) => setForm({ ...form, zoomPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold">Webinar Bundle</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bundle with Webinar</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={form.bundledWebinarId}
                    onChange={(e) => setForm({ ...form, bundledWebinarId: e.target.value })}
                  >
                    <option value="">No webinar bundle</option>
                    {webinars.map(w => (
                      <option key={w.id} value={w.id}>{w.title}</option>
                    ))}
                  </select>
                </div>
                {form.bundledWebinarId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Bundle Description</label>
                      <textarea
                        className="w-full p-2 border rounded-lg h-20"
                        value={form.bundleDescription}
                        onChange={(e) => setForm({ ...form, bundleDescription: e.target.value })}
                      />
                    </div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.webinarOptional}
                        onChange={(e) => setForm({ ...form, webinarOptional: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Webinar registration is optional</span>
                    </label>
                  </>
                )}
              </div>
            </Card>

            {/* Embed Code Section */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Embed Code</h2>
              <p className="text-sm text-gray-600 mb-4">
                Copy this code to embed the event registration form on your website.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Embed URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/embed-event/${event.slug}`}
                      className="flex-1 p-2 border rounded-lg bg-gray-50 text-sm"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        const url = `${window.location.origin}/embed-event/${event.slug}`;
                        navigator.clipboard.writeText(url);
                        alert('URL copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Iframe Embed Code</label>
                  <div className="relative">
                    <textarea
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-50 text-sm font-mono h-24"
                      value={`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed-event/${event.slug}" width="100%" height="600" frameborder="0" style="border:none;"></iframe>`}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        const code = `<iframe src="${window.location.origin}/embed-event/${event.slug}" width="100%" height="600" frameborder="0" style="border:none;"></iframe>`;
                        navigator.clipboard.writeText(code);
                        alert('Embed code copied to clipboard!');
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  <strong>Tip:</strong> The embed form includes the two-step registration process if you have a bundled webinar configured.
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Schedules Tab */}
        {activeTab === 'schedules' && (
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Add New Schedule</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border rounded-lg text-sm"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    className="w-full p-2 border rounded-lg text-sm"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Timezone</label>
                  <select
                    className="w-full p-2 border rounded-lg text-sm"
                    value={newSchedule.timezone}
                    onChange={(e) => setNewSchedule({ ...newSchedule, timezone: e.target.value })}
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Zoom Link Override</label>
                  <input
                    type="url"
                    className="w-full p-2 border rounded-lg text-sm"
                    placeholder="Leave empty to use default"
                    value={newSchedule.zoomLink}
                    onChange={(e) => setNewSchedule({ ...newSchedule, zoomLink: e.target.value })}
                  />
                </div>
              </div>
              <Button type="button" onClick={addSchedule} className="mt-4">
                <Plus className="w-4 h-4 mr-1" /> Add Schedule
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Current Schedules</h2>
              {event.schedules.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No schedules yet</p>
              ) : (
                <div className="space-y-3">
                  {event.schedules.map(schedule => (
                    <div
                      key={schedule.id}
                      className={`p-4 border rounded-lg flex items-center justify-between ${
                        !schedule.isActive ? 'bg-gray-50 opacity-60' : ''
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">
                            {formatDate(schedule.startTime, schedule.timezone)}
                          </span>
                          {!schedule.isActive && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {schedule.timezone.replace(/_/g, ' ')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {schedule._count?.registrations || 0} registered
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteSchedule(schedule.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Registrations Tab */}
        {activeTab === 'registrations' && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Registrations</h2>
            {event.registrations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No registrations yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-left py-2 px-3">Email</th>
                      <th className="text-left py-2 px-3">Schedule</th>
                      <th className="text-left py-2 px-3">Webinar</th>
                      <th className="text-left py-2 px-3">Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.registrations.map(reg => (
                      <tr key={reg.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3">{reg.name}</td>
                        <td className="py-2 px-3">{reg.email}</td>
                        <td className="py-2 px-3 text-xs">
                          {formatDate(reg.eventSchedule.startTime, reg.eventSchedule.timezone)}
                        </td>
                        <td className="py-2 px-3">
                          {reg.webinarRegistrationId ? (
                            <span className="text-green-600 text-xs">✓ Registered</span>
                          ) : reg.skippedWebinar ? (
                            <span className="text-gray-400 text-xs">Skipped</span>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-500">
                          {new Date(reg.registeredAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

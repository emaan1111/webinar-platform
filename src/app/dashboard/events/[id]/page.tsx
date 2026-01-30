'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, Plus, Trash2, Video, Calendar, Users, 
  ExternalLink, Save, Clock 
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

interface WebinarRegistrationData {
  id: string;
  attended: boolean;
  joinedAt?: string | null;
  leftAt?: string | null;
  country?: string | null;
}

interface EventRegistration {
  id: string;
  name: string;
  email: string;
  phone?: string;
  studentAge?: number;
  registeredAt: string;
  attended: boolean;
  skippedWebinar: boolean;
  webinarRegistrationId?: string;
  webinarRegistration?: WebinarRegistrationData;
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
  thankYouPageUrl?: string;
  thankYouTemplateId?: string;
  registrationPageUrl?: string;
  registrationTag?: string;
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

interface ThankYouTemplate {
  id: string;
  name: string;
  description?: string;
}

export default function EventDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [webinars, setWebinars] = useState<Webinar[]>([]);
  const [templates, setTemplates] = useState<ThankYouTemplate[]>([]);
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
    smsReminderEnabled: false,
    smsReminderBody: 'Reminder: Your event starts in 1 hour!',
    thankYouPageUrl: '',
    thankYouTemplateId: '',
    registrationPageUrl: '',
    registrationTag: '',
  });

  const [newSchedule, setNewSchedule] = useState({
    startTime: '',
    endTime: '',
    timezone: 'America/New_York',
    zoomLink: '',
  });

  const [selectedRegistrations, setSelectedRegistrations] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterWebinarStatus, setFilterWebinarStatus] = useState<'all' | 'registered' | 'skipped' | 'none'>('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');

  useEffect(() => {
    fetchEvent();
    fetchWebinars();
    fetchTemplates();
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
          smsReminderEnabled: data.smsReminderEnabled ?? false,
          smsReminderBody: data.smsReminderBody || 'Reminder: Your event starts in 1 hour!',
          thankYouPageUrl: data.thankYouPageUrl || '',
          thankYouTemplateId: data.thankYouTemplateId || '',
          registrationPageUrl: data.registrationPageUrl || '',
          registrationTag: data.registrationTag || '',
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

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/thank-you-templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(Array.isArray(data) ? data : data.templates || []);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
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

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;
    try {
      const res = await fetch(`/api/events/${event?.id}/registrations/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEvent(prev => prev ? ({
          ...prev,
          registrations: prev.registrations.filter(r => r.id !== id)
        }) : null);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete registration');
    }
  };

  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return '-';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (diff < 0) return '-';
    const minutes = Math.floor(diff / 1000 / 60);
    return `${minutes} min`;
  };

  const filteredRegistrations = event?.registrations.filter(reg => {
    // Search Filter
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = 
      reg.name.toLowerCase().includes(searchLower) || 
      reg.email.toLowerCase().includes(searchLower);

    // Webinar Status Filter
    let matchWebinar = true;
    if (filterWebinarStatus === 'registered') matchWebinar = !!reg.webinarRegistrationId;
    if (filterWebinarStatus === 'skipped') matchWebinar = reg.skippedWebinar;
    if (filterWebinarStatus === 'none') matchWebinar = !reg.webinarRegistrationId && !reg.skippedWebinar;

    // Date Filter (Registered At)
    let matchDate = true;
    if (filterDateRange !== 'all') {
      const regDate = new Date(reg.registeredAt);
      const now = new Date();
      
      if (filterDateRange === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        matchDate = regDate >= startOfToday;
      } else if (filterDateRange === 'yesterday') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfToday.getDate() - 1);
        matchDate = regDate >= startOfYesterday && regDate < startOfToday;
      } else if (filterDateRange === 'last24h') {
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        matchDate = regDate >= last24h;
      } else if (filterDateRange === 'last1h') {
        const last1h = new Date(now.getTime() - 60 * 60 * 1000);
        matchDate = regDate >= last1h;
      } else if (filterDateRange === 'custom' && filterDate) {
        matchDate = reg.registeredAt.startsWith(filterDate);
      }
    }

    return matchSearch && matchWebinar && matchDate;
  }) || [];

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
                  <label className="block text-sm font-medium mb-1">Registration Page URL (Optional)</label>
                  <input
                    type="url"
                    className="w-full p-2 border rounded-lg"
                    placeholder="https://mysite.com/register"
                    value={form.registrationPageUrl}
                    onChange={(e) => setForm({ ...form, registrationPageUrl: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If set, referral links will redirect here instead of the default registration page.
                  </p>
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

            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">ClickFunnels</h2>
              <div className="space-y-2">
                <label className="block text-sm font-medium mb-1">Registration Tag</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. EVENT-REGISTERED"
                  value={form.registrationTag}
                  onChange={(e) => setForm({ ...form, registrationTag: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Applied in ClickFunnels when someone registers for this event.
                </p>
              </div>
            </Card>

            {/* Thank You Page Settings */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Thank You Page</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Thank You Template</label>
                  <select
                    className="w-full p-2 border rounded-lg"
                    value={form.thankYouTemplateId}
                    onChange={(e) => setForm({ ...form, thankYouTemplateId: e.target.value })}
                  >
                    <option value="">Use default confirmation screen</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select a thank you template to display after registration.
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium mb-1">Or: Custom Thank You Page URL</label>
                  <input
                    type="url"
                    className="w-full p-2 border rounded-lg"
                    value={form.thankYouPageUrl}
                    onChange={(e) => setForm({ ...form, thankYouPageUrl: e.target.value })}
                    placeholder="https://yoursite.com/thank-you"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Takes priority over template. Enter a full URL to redirect to an external page.
                  </p>
                </div>
                
                {/* Placeholder Reference */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Available Template Placeholders</h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>Event:</strong> {`{{eventTitle}}, {{eventDate}}, {{eventTime}}, {{eventDateTime}}, {{eventZoomLink}}`}</p>
                    <p><strong>Attendee:</strong> {`{{attendeeName}}, {{attendeeEmail}}, {{studentName}}, {{studentAge}}`}</p>
                    <p><strong>Zoom:</strong> {`{{zoomLink}}, {{zoomMeetingId}}, {{zoomPassword}}`}</p>
                    <p><strong>Calendar:</strong> {`{{googleCalendarLink}}, {{appleCalendarLink}}`}</p>
                  </div>
                </div>
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
                  <label className="block text-sm font-medium mb-1">Embed Code</label>
                  <p className="text-xs text-gray-500 mb-2">Automatically includes Split Test tracking from the page URL</p>
                  <div className="relative">
                    <textarea
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-50 text-sm font-mono h-24"
                      value={`<!-- Event Registration Embed -->
<div id="event-embed-${event.slug}"></div>
<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/embed-event/${event.slug}"></script>`}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        const code = `<!-- Event Registration Embed -->\n<div id="event-embed-${event.slug}"></div>\n<script src="${window.location.origin}/api/embed-event/${event.slug}"></script>`;
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
            <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
              <h2 className="text-lg font-semibold cursor-default">Registrations ({filteredRegistrations.length})</h2>
              <div className="flex gap-2 flex-wrap">
                <input 
                  type="text" 
                  placeholder="Search name or email..." 
                  className="px-3 py-2 border rounded-md text-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <select 
                  className="px-3 py-2 border rounded-md text-sm cursor-pointer"
                  value={filterWebinarStatus}
                  onChange={e => setFilterWebinarStatus(e.target.value as any)}
                >
                  <option value="all">All Types</option>
                  <option value="registered">With Webinar</option>
                  <option value="skipped">Skipped Webinar</option>
                  <option value="none">Event Only</option>
                </select>
                <select 
                  className="px-3 py-2 border rounded-md text-sm cursor-pointer"
                  value={filterDateRange}
                  onChange={e => setFilterDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last24h">Last 24 Hours</option>
                  <option value="last1h">Last Hour</option>
                  <option value="custom">Custom Date</option>
                </select>
                {filterDateRange === 'custom' && (
                  <input 
                    type="date" 
                    className="px-3 py-2 border rounded-md text-sm cursor-pointer"
                    value={filterDate}
                    onChange={e => setFilterDate(e.target.value)}
                  />
                )}
              </div>
            </div>

            {filteredRegistrations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No registrations found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Name</th>
                      <th className="text-left py-2 px-3">Student Age</th>
                      <th className="text-left py-2 px-3">Country</th>
                      <th className="text-left py-2 px-3">Email</th>
                      <th className="text-left py-2 px-3">Event Schedule</th>
                      <th className="text-left py-2 px-3">Webinar Status</th>
                      <th className="text-left py-2 px-3">Attended</th>
                      <th className="text-left py-2 px-3">Time Watched</th>
                      <th className="text-right py-2 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map(reg => (
                      <tr key={reg.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{reg.name}</td>
                        <td className="py-2 px-3">{reg.studentAge || '-'}</td>
                        <td className="py-2 px-3">{reg.webinarRegistration?.country || '-'}</td>
                        <td className="py-2 px-3">{reg.email}</td>
                        <td className="py-2 px-3 text-xs">
                          {formatDate(reg.eventSchedule.startTime, reg.eventSchedule.timezone)}
                        </td>
                        <td className="py-2 px-3 text-xs">
                          {reg.webinarRegistrationId ? (
                            <span className="text-green-700 bg-green-50 px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider">Registered</span>
                          ) : reg.skippedWebinar ? (
                            <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Skipped</span>
                          ) : (
                            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">N/A</span>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {reg.webinarRegistrationId ? (
                            reg.webinarRegistration?.attended ? 
                              <span className="text-green-600 font-bold text-xs uppercase">Yes</span> : 
                              <span className="text-gray-400 text-xs uppercase">No</span>
                          ) : '-'}
                        </td>
                         <td className="py-2 px-3">
                          {reg.webinarRegistrationId ? (
                             calculateDuration(reg.webinarRegistration?.joinedAt, reg.webinarRegistration?.leftAt)
                          ) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button 
                            onClick={() => handleDeleteRegistration(reg.id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                            title="Delete Registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

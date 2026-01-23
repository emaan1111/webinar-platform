'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, Trash2, Video, Calendar } from 'lucide-react';
import Link from 'next/link';

interface Webinar {
  id: string;
  title: string;
  slug: string;
}

interface Schedule {
  startTime: string;
  endTime: string;
  timezone: string;
  zoomLink?: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [webinars, setWebinars] = useState<Webinar[]>([]);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    zoomLink: '',
    zoomMeetingId: '',
    zoomPassword: '',
    bundledWebinarId: '',
    bundleDescription: '',
    webinarOptional: true,
    maxAttendees: '',
    requirePhone: false,
  });

  const [schedules, setSchedules] = useState<Schedule[]>([
    { startTime: '', endTime: '', timezone: 'America/New_York', zoomLink: '' }
  ]);

  useEffect(() => {
    fetchWebinars();
  }, []);

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

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (title: string) => {
    setForm({
      ...form,
      title,
      slug: form.slug || generateSlug(title),
    });
  };

  const addSchedule = () => {
    setSchedules([...schedules, { startTime: '', endTime: '', timezone: 'America/New_York', zoomLink: '' }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: keyof Schedule, value: string) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Filter out empty schedules
      const validSchedules = schedules.filter(s => s.startTime);

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxAttendees: form.maxAttendees ? parseInt(form.maxAttendees) : null,
          schedules: validSchedules,
        }),
      });

      if (res.ok) {
        const event = await res.json();
        router.push(`/dashboard/events/${event.id}`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Asia/Dubai',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Singapore',
    'Australia/Sydney',
  ];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <Link href="/dashboard/events" className="inline-flex items-center text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Event Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g. Monthly Q&A Session"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL Slug *</label>
                <div className="flex items-center">
                  <span className="bg-gray-100 p-2 border border-r-0 rounded-l-lg text-gray-500">/event/</span>
                  <input
                    type="text"
                    required
                    className="flex-1 p-2 border rounded-r-lg"
                    placeholder="monthly-qa"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full p-2 border rounded-lg h-24"
                  placeholder="What is this event about?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {/* Zoom Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Zoom Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Zoom Meeting Link</label>
                <input
                  type="url"
                  className="w-full p-2 border rounded-lg"
                  placeholder="https://zoom.us/j/..."
                  value={form.zoomLink}
                  onChange={(e) => setForm({ ...form, zoomLink: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">Default link for all schedules (can override per schedule)</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meeting ID</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    placeholder="123 456 7890"
                    value={form.zoomMeetingId}
                    onChange={(e) => setForm({ ...form, zoomMeetingId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg"
                    placeholder="abc123"
                    value={form.zoomPassword}
                    onChange={(e) => setForm({ ...form, zoomPassword: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Schedules */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Event Schedules</h2>
              <Button type="button" variant="outline" size="sm" onClick={addSchedule}>
                <Plus className="w-4 h-4 mr-1" /> Add Date
              </Button>
            </div>

            <div className="space-y-4">
              {schedules.map((schedule, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      <Calendar className="w-4 h-4 inline mr-1" /> Schedule {index + 1}
                    </span>
                    {schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSchedule(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Start Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        className="w-full p-2 border rounded-lg text-sm"
                        value={schedule.startTime}
                        onChange={(e) => updateSchedule(index, 'startTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">End Date & Time</label>
                      <input
                        type="datetime-local"
                        className="w-full p-2 border rounded-lg text-sm"
                        value={schedule.endTime}
                        onChange={(e) => updateSchedule(index, 'endTime', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Timezone</label>
                      <select
                        className="w-full p-2 border rounded-lg text-sm"
                        value={schedule.timezone}
                        onChange={(e) => updateSchedule(index, 'timezone', e.target.value)}
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
                        value={schedule.zoomLink || ''}
                        onChange={(e) => updateSchedule(index, 'zoomLink', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Webinar Bundle */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Video className="w-5 h-5 text-purple-600" />
              <h2 className="text-lg font-semibold">Webinar Bundle (Optional)</h2>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Bundle a webinar with this event. Attendees can register for both in a two-step process.
            </p>

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
                      placeholder="Explain why they should also register for the webinar..."
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
                    <span className="text-sm">Webinar registration is optional (can skip)</span>
                  </label>
                </>
              )}
            </div>
          </Card>

          {/* Registration Settings */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Registration Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Attendees per Schedule</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded-lg"
                  placeholder="Leave empty for unlimited"
                  value={form.maxAttendees}
                  onChange={(e) => setForm({ ...form, maxAttendees: e.target.value })}
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.requirePhone}
                  onChange={(e) => setForm({ ...form, requirePhone: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Require phone number</span>
              </label>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Link href="/dashboard/events">
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

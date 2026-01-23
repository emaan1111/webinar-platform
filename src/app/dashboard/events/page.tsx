'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Calendar, Users, ExternalLink, Edit, Trash2, Video } from 'lucide-react';

interface EventSchedule {
  id: string;
  startTime: string;
  endTime?: string;
  timezone: string;
  _count?: { registrations: number };
}

interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  zoomLink?: string;
  bundledWebinar?: {
    id: string;
    title: string;
    slug: string;
  };
  schedules: EventSchedule[];
  _count: { registrations: number };
  createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event? This will also delete all registrations.')) {
      return;
    }

    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEvents(events.filter(e => e.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PUBLISHED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
    };
    return styles[status] || styles.DRAFT;
  };

  const getNextSchedule = (schedules: EventSchedule[]) => {
    const now = new Date();
    const upcoming = schedules.filter(s => new Date(s.startTime) > now);
    return upcoming[0];
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p>Loading events...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500">Manage your Zoom events with optional webinar bundles</p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Create Event
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Events Yet</h3>
          <p className="text-gray-500 mb-4">Create your first event to start accepting registrations.</p>
          <Link href="/dashboard/events/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create Your First Event
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map(event => {
            const nextSchedule = getNextSchedule(event.schedules);
            
            return (
              <Card key={event.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
                        {event.status}
                      </span>
                      {event.bundledWebinar && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                          <Video className="w-3 h-3" /> + Webinar Bundle
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {event.schedules.length} schedule{event.schedules.length !== 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {event._count.registrations} registration{event._count.registrations !== 1 ? 's' : ''}
                      </span>
                      {nextSchedule && (
                        <span className="text-blue-600">
                          Next: {formatDate(nextSchedule.startTime)}
                        </span>
                      )}
                    </div>

                    {event.bundledWebinar && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Bundled with:</span> {event.bundledWebinar.title}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Public URL:</span>
                      <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">/event/{event.slug}</code>
                      <a 
                        href={`/event/${event.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, HelpCircle, GripVertical } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

export default function WebinarFaqPage() {
  const params = useParams();
  const router = useRouter();
  const webinarId = params?.id as string;

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });

  useEffect(() => {
    fetchFaqs();
  }, [webinarId]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/webinars/${webinarId}/faq`);
      const data = await response.json();

      if (response.ok) {
        setFaqs(data.faqs || []);
      } else {
        alert(data.error || 'Failed to load FAQs');
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      alert('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Please fill in both question and answer');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/webinars/${webinarId}/faq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFaqs([...faqs, data.faq]);
        setFormData({ question: '', answer: '' });
        setShowAddForm(false);
      } else {
        alert(data.error || 'Failed to add FAQ');
      }
    } catch (error) {
      console.error('Error adding FAQ:', error);
      alert('Failed to add FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (faqId: string) => {
    if (!formData.question.trim() || !formData.answer.trim()) {
      alert('Please fill in both question and answer');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/webinars/${webinarId}/faq/${faqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFaqs(faqs.map((faq) => (faq.id === faqId ? data.faq : faq)));
        setEditingId(null);
        setFormData({ question: '', answer: '' });
      } else {
        alert(data.error || 'Failed to update FAQ');
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      alert('Failed to update FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) {
      return;
    }

    setDeleting(faqId);
    try {
      const response = await fetch(`/api/webinars/${webinarId}/faq/${faqId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFaqs(faqs.filter((faq) => faq.id !== faqId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ');
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({ question: faq.question, answer: faq.answer });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ question: '', answer: '' });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading FAQs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push(`/dashboard/webinars/${webinarId}`)}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Webinar FAQs</h1>
            </div>
            <p className="mt-2 text-gray-600">
              Manage frequently asked questions shown during your webinar
            </p>
          </div>
          {!showAddForm && !editingId && (
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add FAQ
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingId) && (
          <Card className="p-6 border-2 border-blue-500">
            <form onSubmit={editingId ? (e) => { e.preventDefault(); handleUpdate(editingId); } : handleAdd}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question *
                  </label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    placeholder="What is your refund policy?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer *
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    placeholder="We offer a 30-day money-back guarantee..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="secondary" onClick={cancelEdit}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : editingId ? 'Update FAQ' : 'Add FAQ'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        )}

        {/* FAQs List */}
        {faqs.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <HelpCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No FAQs Yet
            </h3>
            <p className="mb-6 text-gray-500">
              Add your first FAQ to help attendees with common questions
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First FAQ
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="flex-shrink-0 pt-2 cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 whitespace-pre-line">
                      {faq.answer}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(faq)}
                      disabled={editingId !== null || showAddForm}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(faq.id)}
                      disabled={deleting === faq.id || editingId !== null || showAddForm}
                    >
                      {deleting === faq.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Info Box */}
        <Card className="border-l-4 border-blue-500 bg-blue-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <HelpCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About FAQs
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  FAQs help address common questions and objections during your webinar.
                  They can be displayed during offer phases to increase conversions.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

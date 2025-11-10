'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ArrowLeft, HelpCircle, Plus, Trash2 } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}

interface Props {
  webinarId: string;
  webinarTitle: string;
  initialFaqs: FaqItem[];
}

export default function WebinarFaqManagerClient({
  webinarId,
  webinarTitle,
  initialFaqs,
}: Props) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const orderedFaqs = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);

  const resetFeedback = () => {
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!question.trim() || !answer.trim()) {
      setError('Please provide both a question and an answer.');
      resetFeedback();
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/webinars/${webinarId}/faq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create FAQ item');
      }

      setFaqs((prev) =>
        [...prev, data.faq].sort((a, b) => a.sortOrder - b.sortOrder)
      );
      setQuestion('');
      setAnswer('');
      setMessage('FAQ item added');
      resetFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add FAQ item');
      resetFeedback();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Delete this FAQ item?')) {
      return;
    }

    setDeletingId(faqId);
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `/api/webinars/${webinarId}/faq/${faqId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete FAQ');
      }

      setFaqs((prev) => prev.filter((faq) => faq.id !== faqId));
      setMessage('FAQ item deleted');
      resetFeedback();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete FAQ');
      resetFeedback();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">
              Webinar FAQ
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              {webinarTitle}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Build a quick FAQ list that appears inside the live room during
              the offer phase.
            </p>
          </div>
          <Link href={`/dashboard/webinars/${webinarId}`}>
            <Button variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to webinar
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-500" />
              Add FAQ item
            </h2>
          </CardHeader>
          <CardBody>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="What do attendees need to know?"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Answer
                </label>
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows={4}
                  placeholder="Give a concise, reassuring answer."
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Tip: Highlight objections (price, timing, access, guarantees).
                </p>
                <Button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {loading ? 'Adding...' : 'Add FAQ'}
                </Button>
              </div>
            </form>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Existing FAQs</h2>
          </CardHeader>
          <CardBody>
            {orderedFaqs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No FAQ items yet. Add your first one above.
              </div>
            ) : (
              <div className="space-y-4">
                {orderedFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-gray-900">
                          {faq.question}
                        </p>
                        <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                          {faq.answer}
                        </p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(faq.id)}
                        disabled={deletingId === faq.id}
                        className="inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === faq.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Trash, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { type LeadPage } from '@prisma/client';
import SearchableSelect from '@/components/ui/SearchableSelect';

export default function EditSplitTest() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  
  const [leadPages, setLeadPages] = useState<LeadPage[]>([]);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [variants, setVariants] = useState<{ id?: string; leadPageId: string; weight: number }[]>([
    { leadPageId: '', weight: 50 },
    { leadPageId: '', weight: 50 }
  ]);

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch available Lead Pages
            const pagesRes = await fetch('/api/lead-pages');
            const pagesData = await pagesRes.json();
            setLeadPages(pagesData);

            // Fetch Split Test Data
            const testRes = await fetch(`/api/split-tests/${id}/analytics?range=all`); // Using analytics endpoint to get structure with variants
            if (!testRes.ok) throw new Error('Failed to load split test');
            const testData = await testRes.json();
            const { test } = testData;

            setName(test.name);
            setSlug(test.slug);
            setIsActive(test.isActive);
            setVariants(test.variants.map((v: any) => ({
                id: v.id,
                leadPageId: v.leadPageId,
                weight: v.weight
            })));

        } catch (err) {
            console.error(err);
            setError('Failed to load data');
        } finally {
            setFetching(false);
        }
    };

    if (id) {
        fetchData();
    }
  }, [id]);

  const handleVariantChange = (index: number, field: 'leadPageId' | 'weight', value: string | number) => {
    const newVariants = [...variants];
    // @ts-ignore
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { leadPageId: '', weight: 0 }]);
  };

  const removeVariant = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index);
    setVariants(newVariants);
  };

  const totalWeight = variants.reduce((sum, v) => sum + Number(v.weight), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (totalWeight !== 100) {
        setError('Total weight must equal 100%');
        setLoading(false);
        return;
    }

    if (variants.some(v => !v.leadPageId)) {
        setError('Please select a lead page for every variant');
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(`/api/split-tests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          isActive,
          variants: variants.map(v => ({
             id: v.id, // Include ID for existing variants
             leadPageId: v.leadPageId,
             weight: Number(v.weight)
          }))
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update split test');
      }

      router.push(`/dashboard/split-tests/${id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return (
        <DashboardLayout>
            <div className="flex justify-center p-12">Loading...</div>
        </DashboardLayout>
      )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Link href={`/dashboard/split-tests/${id}`} className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-2">
           <ArrowLeft className="w-4 h-4 mr-1" /> Back to Details
        </Link>
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Edit Split Test</h1>
            <div className="flex items-center gap-2">
                 <span className={`text-sm ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                    {isActive ? 'Active' : 'Inactive'}
                 </span>
                 <Button 
                    type="button" 
                    variant={isActive ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={() => setIsActive(!isActive)}
                 >
                    {isActive ? 'Pause Test' : 'Activate Test'}
                 </Button>
            </div>
        </div>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Test Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Hero Headline Test"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                /t/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="headline-test"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                Test Variants
                </label>
                <div className={`text-sm font-bold ${totalWeight === 100 ? 'text-green-600' : 'text-red-500'}`}>
                    Total Weight: {totalWeight}%
                </div>
            </div>
            
            {variants.map((variant, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Lead Page</label>
                        <SearchableSelect
                            value={variant.leadPageId}
                            onChange={(val) => handleVariantChange(index, 'leadPageId', val)}
                            placeholder="Select a page..."
                            emptyMessage="No lead pages found"
                            options={leadPages.map(page => ({
                                value: page.id,
                                label: page.name,
                                sublabel: `(/p/${page.slug})`,
                            }))}
                        />
                    </div>
                    <div className="w-24">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Weight %</label>
                        <input
                            type="number"
                            required
                            min="0"
                            max="100"
                            value={variant.weight}
                            onChange={(e) => handleVariantChange(index, 'weight', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="mt-6 text-gray-400 hover:text-red-500 transition-colors"
                        disabled={variants.length <= 1} // Allow removing down to 1 if needed, though split test implies 2+
                    >
                        <Trash className="w-5 h-5" />
                    </button>
                </div>
            ))}

            <Button type="button" variant="outline" size="sm" onClick={addVariant} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" /> Add Variant
            </Button>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Link href={`/dashboard/split-tests/${id}`}>
              <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" disabled={loading || totalWeight !== 100}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
}

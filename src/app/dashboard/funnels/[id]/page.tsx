'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Loader2, Plus, Trash2, ArrowLeft, ExternalLink } from 'lucide-react'

interface Product {
  id: string
  name: string
  priceInCents: number
  currency: string
}

interface Step {
  id: string
  type: 'ORDER_FORM' | 'UPSELL' | 'DOWNSELL' | 'CONFIRMATION'
  order: number
  productId: string | null
  product: Product | null
  headline: string | null
  subheadline: string | null
  description: string | null
  videoUrl: string | null
  imageUrl: string | null
  yesButtonText: string | null
  noButtonText: string | null
  declineNextOrder: number | null
  customHtml: string | null
  customCss: string | null
}

interface Funnel {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  successRedirectUrl: string | null
  brandColor: string | null
  brandLogoUrl: string | null
  steps: Step[]
}

export default function FunnelEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [savingMeta, setSavingMeta] = useState(false)
  const [meta, setMeta] = useState({
    name: '',
    slug: '',
    description: '',
    isActive: true,
    successRedirectUrl: '',
    brandColor: '',
    brandLogoUrl: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    const [fr, pr] = await Promise.all([
      fetch(`/api/funnels/${params.id}`),
      fetch(`/api/products`),
    ])
    const fd = await fr.json()
    const pd = await pr.json()
    setFunnel(fd.funnel)
    setProducts(pd.products || [])
    if (fd.funnel) {
      setMeta({
        name: fd.funnel.name || '',
        slug: fd.funnel.slug || '',
        description: fd.funnel.description || '',
        isActive: !!fd.funnel.isActive,
        successRedirectUrl: fd.funnel.successRedirectUrl || '',
        brandColor: fd.funnel.brandColor || '',
        brandLogoUrl: fd.funnel.brandLogoUrl || '',
      })
    }
    setLoading(false)
  }, [params.id])

  useEffect(() => {
    load()
  }, [load])

  const saveMeta = async () => {
    setSavingMeta(true)
    await fetch(`/api/funnels/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    })
    await load()
    setSavingMeta(false)
  }

  const addStep = async (type: 'UPSELL' | 'DOWNSELL') => {
    await fetch(`/api/funnels/${params.id}/steps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        headline:
          type === 'UPSELL'
            ? 'Wait! Add this to your order'
            : 'How about this instead?',
        yesButtonText: type === 'UPSELL' ? 'Yes! Add to my order' : 'Yes, I want it',
        noButtonText: 'No thanks',
      }),
    })
    await load()
  }

  const updateStep = async (stepId: string, patch: Partial<Step>) => {
    await fetch(`/api/funnels/${params.id}/steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    await load()
  }

  const deleteStep = async (stepId: string) => {
    if (!confirm('Delete this step?')) return
    await fetch(`/api/funnels/${params.id}/steps/${stepId}`, { method: 'DELETE' })
    await load()
  }

  const deleteFunnel = async () => {
    if (!confirm('Delete this entire funnel? This cannot be undone.')) return
    await fetch(`/api/funnels/${params.id}`, { method: 'DELETE' })
    router.push('/dashboard/funnels')
  }

  if (loading || !funnel) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  const checkoutUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/checkout/${funnel.slug}`
      : `/checkout/${funnel.slug}`

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard/funnels')}
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" /> All funnels
          </button>
          <div className="flex gap-2">
            <a
              href={`/checkout/${funnel.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" /> Preview
            </a>
            <Button variant="danger" size="sm" onClick={deleteFunnel}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold">Funnel settings</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  type="text"
                  value={meta.name}
                  onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="URL slug">
                <input
                  type="text"
                  value={meta.slug}
                  onChange={(e) => setMeta({ ...meta, slug: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Description" full>
                <textarea
                  rows={2}
                  value={meta.description}
                  onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Brand color (hex)">
                <input
                  type="text"
                  placeholder="#2563eb"
                  value={meta.brandColor}
                  onChange={(e) => setMeta({ ...meta, brandColor: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Brand logo URL">
                <input
                  type="url"
                  value={meta.brandLogoUrl}
                  onChange={(e) => setMeta({ ...meta, brandLogoUrl: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Success redirect URL (optional)" full>
                <input
                  type="url"
                  placeholder="Leave blank to use built-in confirmation page"
                  value={meta.successRedirectUrl}
                  onChange={(e) => setMeta({ ...meta, successRedirectUrl: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={meta.isActive}
                  onChange={(e) => setMeta({ ...meta, isActive: e.target.checked })}
                />
                <span className="text-sm">Active (accept orders)</span>
              </label>
              <Button onClick={saveMeta} disabled={savingMeta} size="sm">
                {savingMeta ? 'Saving...' : 'Save settings'}
              </Button>
              <span className="text-xs text-gray-500">
                Public URL: <code className="rounded bg-gray-100 px-1.5 py-0.5">{checkoutUrl}</code>
              </span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Funnel steps</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => addStep('UPSELL')}>
                  <Plus className="mr-1 inline h-4 w-4" /> Upsell
                </Button>
                <Button size="sm" variant="secondary" onClick={() => addStep('DOWNSELL')}>
                  <Plus className="mr-1 inline h-4 w-4" /> Downsell
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {funnel.steps.map((step) => (
                <StepCard
                  key={step.id}
                  step={step}
                  steps={funnel.steps}
                  products={products}
                  onUpdate={(patch) => updateStep(step.id, patch)}
                  onDelete={() => deleteStep(step.id)}
                />
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 id="custom-html-reference" className="text-xl font-bold">
              Custom HTML reference
            </h2>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-600">
              When you set <code className="rounded bg-gray-100 px-1">Custom HTML</code> on a step, your HTML replaces our default design.
              Hook our form behavior into your design using <code className="rounded bg-gray-100 px-1">data-*</code> attributes.
              Card data still goes through Stripe&apos;s iframe, so PCI scope (SAQ A) is preserved.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Order form (ORDER_FORM)</h3>
                <ul className="mt-2 space-y-1 text-xs text-gray-700">
                  <li><code className="rounded bg-gray-100 px-1">{`<input data-checkout-field="email">`}</code></li>
                  <li><code className="rounded bg-gray-100 px-1">{`<input data-checkout-field="firstName|lastName|phone">`}</code></li>
                  <li><code className="rounded bg-gray-100 px-1">{`<input data-checkout-field="line1|line2|city|state|postalCode|country">`}</code></li>
                  <li><code className="rounded bg-gray-100 px-1">{`<div data-stripe-payment></div>`}</code> — Stripe card iframe mounts here</li>
                  <li><code className="rounded bg-gray-100 px-1">{`<button data-checkout-submit>...`}</code> — submit handler</li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">Upsell / Downsell</h3>
                <ul className="mt-2 space-y-1 text-xs text-gray-700">
                  <li><code className="rounded bg-gray-100 px-1">{`<button data-checkout-yes>...`}</code> — one-click charge saved card</li>
                  <li><code className="rounded bg-gray-100 px-1">{`<button data-checkout-no>...`}</code> — skip / decline</li>
                </ul>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-900">Shared on every step</h3>
                <ul className="mt-2 space-y-1 text-xs text-gray-700">
                  <li><code className="rounded bg-gray-100 px-1">data-checkout-product-name</code> — element&apos;s text replaced with product name</li>
                  <li><code className="rounded bg-gray-100 px-1">data-checkout-product-price</code> — element&apos;s text replaced with formatted price</li>
                  <li><code className="rounded bg-gray-100 px-1">data-checkout-error</code> — error messages render here (hidden when empty)</li>
                  <li><code className="rounded bg-gray-100 px-1">data-checkout-processing</code> — shown only while submitting (loading state)</li>
                </ul>
              </div>
            </div>

            <details className="mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                Example: minimal order form
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">{`<div style="max-width:480px;margin:60px auto;padding:24px;border-radius:12px;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.06)">
  <h1 style="font-size:24px;margin:0 0 4px">Buy <span data-checkout-product-name></span></h1>
  <p style="color:#666;margin:0 0 24px"><span data-checkout-product-price></span></p>

  <input data-checkout-field="email" placeholder="Email address" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #ccc;border-radius:6px" />
  <input data-checkout-field="firstName" placeholder="First name" style="width:100%;padding:12px;margin-bottom:8px;border:1px solid #ccc;border-radius:6px" />

  <div data-stripe-payment style="margin:12px 0"></div>

  <div data-checkout-error style="display:none;color:#c00;font-size:14px;margin-bottom:8px"></div>
  <div data-checkout-processing style="display:none;color:#666;font-size:14px;margin-bottom:8px">Processing…</div>

  <button data-checkout-submit style="width:100%;padding:14px;background:#16a34a;color:#fff;border:0;border-radius:6px;font-size:16px;font-weight:600;cursor:pointer">
    Complete order
  </button>
</div>`}</pre>
            </details>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                Example: minimal upsell page
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs text-gray-100">{`<div style="max-width:560px;margin:60px auto;text-align:center">
  <h1>Wait — add <span data-checkout-product-name></span> for just <span data-checkout-product-price></span>?</h1>
  <p>One click and we'll add it to your order with the card you already used.</p>

  <div data-checkout-error style="display:none;color:#c00"></div>
  <div data-checkout-processing style="display:none">Adding to your order…</div>

  <button data-checkout-yes style="padding:14px 28px;background:#16a34a;color:#fff;border:0;border-radius:6px;font-size:16px;cursor:pointer">
    Yes, add it to my order
  </button>
  <div style="margin-top:12px">
    <button data-checkout-no style="background:none;border:0;color:#666;text-decoration:underline;cursor:pointer">
      No thanks
    </button>
  </div>
</div>`}</pre>
            </details>
          </CardBody>
        </Card>
      </div>
    </DashboardLayout>
  )
}

const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

function Field({
  label,
  children,
  full,
}: {
  label: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <label className={`block ${full ? 'md:col-span-2' : ''}`}>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  )
}

function StepCard({
  step,
  steps,
  products,
  onUpdate,
  onDelete,
}: {
  step: Step
  steps: Step[]
  products: Product[]
  onUpdate: (patch: Partial<Step>) => void
  onDelete: () => void
}) {
  const isOffer = step.type === 'UPSELL' || step.type === 'DOWNSELL'
  const isOrderForm = step.type === 'ORDER_FORM'
  const isConfirm = step.type === 'CONFIRMATION'

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-0.5 text-xs font-bold ${stepColor(step.type)}`}
          >
            STEP {step.order} · {prettyType(step.type)}
          </span>
        </div>
        {!isOrderForm && !isConfirm && (
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="p-4">
        {isConfirm ? (
          <p className="text-sm text-gray-500">
            Customers land here after the funnel completes. (Built-in confirmation page —
            customize via "Success redirect URL" in settings to send elsewhere.)
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={isOrderForm ? 'Initial product' : 'Upsell/downsell product'} full>
              <select
                value={step.productId || ''}
                onChange={(e) => onUpdate({ productId: e.target.value || null })}
                className={inputCls}
              >
                <option value="">— No product —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${(p.priceInCents / 100).toFixed(2)})
                  </option>
                ))}
              </select>
            </Field>

            {isOffer && (
              <>
                <Field label="Headline">
                  <input
                    type="text"
                    value={step.headline || ''}
                    onChange={(e) => onUpdate({ headline: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Subheadline">
                  <input
                    type="text"
                    value={step.subheadline || ''}
                    onChange={(e) => onUpdate({ subheadline: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Description" full>
                  <textarea
                    rows={3}
                    value={step.description || ''}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Video URL (embed)">
                  <input
                    type="url"
                    value={step.videoUrl || ''}
                    onChange={(e) => onUpdate({ videoUrl: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Image URL (fallback)">
                  <input
                    type="url"
                    value={step.imageUrl || ''}
                    onChange={(e) => onUpdate({ imageUrl: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="Yes button text">
                  <input
                    type="text"
                    value={step.yesButtonText || ''}
                    onChange={(e) => onUpdate({ yesButtonText: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="No button text">
                  <input
                    type="text"
                    value={step.noButtonText || ''}
                    onChange={(e) => onUpdate({ noButtonText: e.target.value })}
                    className={inputCls}
                  />
                </Field>
                <Field label="If user clicks No, jump to step #" full>
                  <select
                    value={step.declineNextOrder ?? ''}
                    onChange={(e) =>
                      onUpdate({
                        declineNextOrder: e.target.value === '' ? null : parseInt(e.target.value),
                      })
                    }
                    className={inputCls}
                  >
                    <option value="">Next step (default)</option>
                    {steps
                      .filter((s) => s.order > step.order)
                      .map((s) => (
                        <option key={s.id} value={s.order}>
                          Step {s.order} — {prettyType(s.type)}
                        </option>
                      ))}
                  </select>
                </Field>
              </>
            )}

            {/* Custom HTML / CSS for full design control. Applies to order
                form, upsell, and downsell steps. */}
            <div className="md:col-span-2 mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Custom HTML {step.customHtml ? '· active' : '· default design'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Optional. Use data-* attributes to hook our form into your design.
                    {' '}
                    <a
                      href="#custom-html-reference"
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById('custom-html-reference')?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-blue-600 underline"
                    >
                      Reference
                    </a>
                  </div>
                </div>
                {step.customHtml && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ customHtml: null, customCss: null })}
                    className="text-xs text-red-600 underline"
                  >
                    Reset to default design
                  </button>
                )}
              </div>
              <Field label="HTML">
                <textarea
                  value={step.customHtml || ''}
                  onChange={(e) => onUpdate({ customHtml: e.target.value || null })}
                  rows={10}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder={
                    isOrderForm
                      ? '<div>\n  <input data-checkout-field="email" placeholder="Email" />\n  <div data-stripe-payment></div>\n  <button data-checkout-submit>Complete order</button>\n</div>'
                      : '<div>\n  <h1>Wait, add this for <span data-checkout-product-price></span></h1>\n  <button data-checkout-yes>Yes, add it</button>\n  <button data-checkout-no>No thanks</button>\n</div>'
                  }
                />
              </Field>
              <Field label="CSS (optional)">
                <textarea
                  value={step.customCss || ''}
                  onChange={(e) => onUpdate({ customCss: e.target.value || null })}
                  rows={6}
                  className={`${inputCls} font-mono text-xs`}
                  placeholder="body { background: #fafafa; } button { padding: 12px 24px; }"
                />
              </Field>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function prettyType(t: string) {
  return t.replace('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function stepColor(t: string) {
  switch (t) {
    case 'ORDER_FORM':
      return 'bg-blue-100 text-blue-700'
    case 'UPSELL':
      return 'bg-purple-100 text-purple-700'
    case 'DOWNSELL':
      return 'bg-orange-100 text-orange-700'
    case 'CONFIRMATION':
      return 'bg-green-100 text-green-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

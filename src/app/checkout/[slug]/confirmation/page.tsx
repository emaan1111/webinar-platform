'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

interface OrderItem {
  id: string
  priceCents: number
  currency: string
  quantity: number
  product: { id: string; name: string; imageUrl: string | null }
}

interface Order {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  totalCents: number
  currency: string
  items: OrderItem[]
  funnel: {
    id: string
    name: string
    brandColor: string | null
    brandLogoUrl: string | null
  } | null
}

function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function ConfirmationPage() {
  const params = useParams<{ slug: string }>()
  const search = useSearchParams()
  const orderId = search.get('orderId')
  const orderToken = search.get('token')

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    let cancelled = false

    const load = async () => {
      const res = await fetch(
        `/api/orders/${orderId}?token=${encodeURIComponent(orderToken || '')}`
      )
      const data = await res.json()
      if (cancelled) return
      const ord: Order | null = data.order || null
      setOrder(ord)
      // The webhook writes order items + sets PAID asynchronously. If items
      // are still empty, retry briefly (up to ~6s) before giving up.
      if (ord && ord.items.length === 0 && retries < 6) {
        setTimeout(() => setRetries((r) => r + 1), 1000)
        return
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [orderId, retries, orderToken])

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Missing order id.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">Order not found.</p>
      </div>
    )
  }

  const brand = order.funnel?.brandColor || '#16a34a'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          {order.funnel?.brandLogoUrl ? (
            <img src={order.funnel.brandLogoUrl} alt="" className="h-8" />
          ) : (
            <div className="text-lg font-bold text-gray-900">{order.funnel?.name}</div>
          )}
          <div className="text-xs text-gray-500">Order #{order.id.slice(-8).toUpperCase()}</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="p-8 text-center">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: `${brand}20` }}
            >
              <CheckCircle className="h-10 w-10" style={{ color: brand }} />
            </div>

            <h1 className="mt-4 text-3xl font-extrabold text-gray-900">
              Thank you for your order!
            </h1>
            <p className="mt-2 text-gray-600">
              We've sent a receipt to <span className="font-semibold">{order.email}</span>
            </p>
          </div>

          <div className="border-t border-gray-200 px-8 py-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Order summary
            </h2>

            <ul className="mt-4 divide-y divide-gray-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 py-3">
                  {item.product.imageUrl && (
                    <img
                      src={item.product.imageUrl}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{item.product.name}</div>
                    {item.quantity > 1 && (
                      <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                    )}
                  </div>
                  <div className="font-semibold text-gray-900">
                    {formatMoney(item.priceCents * item.quantity, item.currency)}
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>{formatMoney(order.totalCents, order.currency)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-8 py-6 text-center text-sm text-gray-500">
            Questions about your order? Reply to your receipt email and we'll help.
          </div>
        </div>
      </main>
    </div>
  )
}

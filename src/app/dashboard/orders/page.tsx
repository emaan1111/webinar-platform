'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Loader2, ShoppingBag } from 'lucide-react'

interface OrderItem {
  id: string
  priceCents: number
  quantity: number
  currency: string
  product: { name: string }
}
interface Payment {
  id: string
  amountCents: number
  status: string
  source: string | null
}
interface Order {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  status: string
  totalCents: number
  currency: string
  createdAt: string
  funnel: { id: string; name: string; slug: string } | null
  items: OrderItem[]
  payments: Payment[]
}

function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .finally(() => setLoading(false))
  }, [])

  const stats = {
    total: orders.length,
    paid: orders.filter((o) => o.status === 'PAID').length,
    revenueCents: orders
      .filter((o) => o.status === 'PAID')
      .reduce((sum, o) => sum + o.totalCents, 0),
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">All checkout funnel orders</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatBox label="Total orders" value={stats.total.toString()} />
          <StatBox label="Paid orders" value={stats.paid.toString()} />
          <StatBox label="Revenue" value={formatMoney(stats.revenueCents)} />
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardBody>
              <div className="py-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-lg font-medium">No orders yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Orders from your checkout funnels will appear here.
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold">All orders</h2>
            </CardHeader>
            <CardBody>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="py-2 pr-4">When</th>
                      <th className="py-2 pr-4">Customer</th>
                      <th className="py-2 pr-4">Funnel</th>
                      <th className="py-2 pr-4">Items</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2 pr-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="py-3 pr-4 text-gray-500">
                          {new Date(o.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="font-medium text-gray-900">
                            {[o.firstName, o.lastName].filter(Boolean).join(' ') || '—'}
                          </div>
                          <div className="text-xs text-gray-500">{o.email}</div>
                        </td>
                        <td className="py-3 pr-4 text-gray-700">
                          {o.funnel?.name || '—'}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="space-y-0.5">
                            {o.items.map((it) => (
                              <div key={it.id} className="text-xs">
                                {it.product.name}{' '}
                                <span className="text-gray-500">
                                  ({formatMoney(it.priceCents, it.currency)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="py-3 pr-4 text-right font-semibold">
                          {formatMoney(o.totalCents, o.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      </CardBody>
    </Card>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    FAILED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-gray-100 text-gray-700',
    PARTIALLY_PAID: 'bg-blue-100 text-blue-700',
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status}
    </span>
  )
}

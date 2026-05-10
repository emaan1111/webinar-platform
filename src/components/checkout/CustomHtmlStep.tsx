'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

/**
 * Renders a user-supplied HTML string and hydrates it with React behavior
 * via `data-*` hooks. Supported hooks per step type:
 *
 * ORDER_FORM:
 *   - <input data-checkout-field="email|firstName|lastName|phone|line1|line2|city|state|postalCode|country">
 *   - <div   data-stripe-payment></div>      ← Stripe Payment Element mounts here
 *   - <button data-checkout-submit>...        ← submit handler
 *
 * UPSELL / DOWNSELL:
 *   - <button data-checkout-yes>...</button>  ← one-click charge saved card
 *   - <button data-checkout-no>...</button>   ← skip / decline
 *
 * ALL:
 *   - data-checkout-product-name              ← text replaced with product name
 *   - data-checkout-product-price             ← text replaced with formatted price
 *   - data-checkout-error                     ← error messages render here
 *   - data-checkout-processing                ← shown while submitting (toggle .hidden)
 *
 * The custom HTML is rendered verbatim via dangerouslySetInnerHTML so any
 * CSS / layout is up to the funnel designer. The Stripe Payment Element is
 * still an iframe served from Stripe so PCI scope (SAQ A) is preserved.
 */

interface Product {
  id: string
  name: string
  priceInCents: number
  currency: string
}

interface BaseProps {
  html: string
  css?: string | null
  product: Product | null
  funnelSlug: string
}

interface OrderFormProps extends BaseProps {
  mode: 'ORDER_FORM'
  orderId: string
  orderToken: string
  nextStepOrder: number | null
}

interface UpsellProps extends BaseProps {
  mode: 'UPSELL' | 'DOWNSELL'
  orderId: string
  orderToken: string
  stepId: string
  onYes: () => void
  onNo: () => void
  processing: boolean
  error: string | null
}

type Props = OrderFormProps | UpsellProps

function formatMoney(cents: number, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

export function CustomHtmlStep(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [paymentMountNode, setPaymentMountNode] = useState<HTMLElement | null>(null)

  // Inject HTML + run hydration once mounted.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Fill product-name / product-price placeholders.
    if (props.product) {
      container.querySelectorAll<HTMLElement>('[data-checkout-product-name]').forEach((el) => {
        el.textContent = props.product!.name
      })
      container.querySelectorAll<HTMLElement>('[data-checkout-product-price]').forEach((el) => {
        el.textContent = formatMoney(props.product!.priceInCents, props.product!.currency)
      })
    }

    if (props.mode === 'ORDER_FORM') {
      // Locate the Stripe Payment Element mount point.
      const stripeMount = container.querySelector<HTMLElement>('[data-stripe-payment]')
      if (stripeMount) setPaymentMountNode(stripeMount)

      // Wire submit button.
      const submitBtn = container.querySelector<HTMLElement>('[data-checkout-submit]')
      if (submitBtn) {
        const handler = (e: Event) => {
          e.preventDefault()
          handleOrderFormSubmit(container, props as OrderFormProps)
        }
        submitBtn.addEventListener('click', handler)
        return () => submitBtn.removeEventListener('click', handler)
      }
    } else {
      // UPSELL / DOWNSELL — wire yes/no buttons.
      const yesBtn = container.querySelector<HTMLElement>('[data-checkout-yes]')
      const noBtn = container.querySelector<HTMLElement>('[data-checkout-no]')
      const yes = (e: Event) => {
        e.preventDefault()
        ;(props as UpsellProps).onYes()
      }
      const no = (e: Event) => {
        e.preventDefault()
        ;(props as UpsellProps).onNo()
      }
      yesBtn?.addEventListener('click', yes)
      noBtn?.addEventListener('click', no)
      return () => {
        yesBtn?.removeEventListener('click', yes)
        noBtn?.removeEventListener('click', no)
      }
    }
  }, [props])

  // Reflect upsell processing/error state into DOM hooks.
  useEffect(() => {
    if (props.mode === 'ORDER_FORM') return
    const container = containerRef.current
    if (!container) return

    const proc = container.querySelector<HTMLElement>('[data-checkout-processing]')
    if (proc) proc.style.display = props.processing ? '' : 'none'

    const err = container.querySelector<HTMLElement>('[data-checkout-error]')
    if (err) {
      err.textContent = props.error || ''
      err.style.display = props.error ? '' : 'none'
    }
  }, [props])

  return (
    <>
      {props.css ? <style dangerouslySetInnerHTML={{ __html: props.css }} /> : null}
      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: props.html }}
      />
      {props.mode === 'ORDER_FORM' && paymentMountNode
        ? createPortal(<PaymentElement />, paymentMountNode)
        : null}
    </>
  )
}

// Pulled out of the component so we can call it from a DOM event handler
// without closure-stale-state problems. Reads field values directly from the
// DOM at click time.
async function handleOrderFormSubmit(container: HTMLElement, props: OrderFormProps) {
  const errEl = container.querySelector<HTMLElement>('[data-checkout-error]')
  const procEl = container.querySelector<HTMLElement>('[data-checkout-processing]')
  const showError = (msg: string | null) => {
    if (errEl) {
      errEl.textContent = msg || ''
      errEl.style.display = msg ? '' : 'none'
    }
  }
  const setProcessing = (on: boolean) => {
    if (procEl) procEl.style.display = on ? '' : 'none'
  }

  const read = (name: string) =>
    (container.querySelector<HTMLInputElement>(`[data-checkout-field="${name}"]`)?.value || '').trim()

  const email = read('email')
  const firstName = read('firstName')
  const lastName = read('lastName')
  const phone = read('phone')
  const address = {
    line1: read('line1'),
    line2: read('line2'),
    city: read('city'),
    state: read('state'),
    postal_code: read('postalCode'),
    country: read('country') || 'US',
  }

  if (!email) {
    showError('Please enter an email address.')
    return
  }

  showError(null)
  setProcessing(true)

  try {
    // Update the existing order with the customer info we just collected.
    await fetch('/api/checkout/update-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: props.orderId,
        orderToken: props.orderToken,
        email,
        firstName,
        lastName,
        phone,
        address,
      }),
    })

    // Confirm the PaymentIntent using the already-mounted Stripe Element.
    // We can't use the React hooks here (we're outside React tree). Instead
    // we dispatch a custom event that the wrapping React form listens for.
    const evt = new CustomEvent('custom-checkout-confirm', {
      detail: { email, firstName, lastName, phone, address },
    })
    container.dispatchEvent(evt)
  } catch (e: any) {
    showError(e?.message || 'Something went wrong')
    setProcessing(false)
  }
}

/**
 * Wrapper that owns the Stripe confirmation. The CustomHtmlStep dispatches
 * a `custom-checkout-confirm` event from inside the user's HTML; this
 * component (which has access to Stripe hooks via <Elements>) listens for
 * it and runs `stripe.confirmPayment`.
 */
export function CustomHtmlOrderFormWithStripe(props: Omit<OrderFormProps, 'mode'>) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!stripe || !elements) return

      const qs = `orderId=${encodeURIComponent(props.orderId)}&token=${encodeURIComponent(props.orderToken)}`
      const returnUrl =
        props.nextStepOrder != null
          ? `${window.location.origin}/checkout/${props.funnelSlug}/step/${props.nextStepOrder}?${qs}`
          : `${window.location.origin}/checkout/${props.funnelSlug}/confirmation?${qs}`

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          payment_method_data: {
            billing_details: {
              email: detail?.email,
              name: [detail?.firstName, detail?.lastName].filter(Boolean).join(' ') || undefined,
              phone: detail?.phone,
              address: {
                line1: detail?.address?.line1 || undefined,
                line2: detail?.address?.line2 || undefined,
                city: detail?.address?.city || undefined,
                state: detail?.address?.state || undefined,
                postal_code: detail?.address?.postal_code || undefined,
                country: detail?.address?.country || undefined,
              },
            },
          },
        },
        redirect: 'if_required',
      })

      if (error) {
        const errEl = wrapper.querySelector<HTMLElement>('[data-checkout-error]')
        const procEl = wrapper.querySelector<HTMLElement>('[data-checkout-processing]')
        if (errEl) {
          errEl.textContent = error.message || 'Payment failed'
          errEl.style.display = ''
        }
        if (procEl) procEl.style.display = 'none'
        return
      }
      router.push(
        props.nextStepOrder != null
          ? `/checkout/${props.funnelSlug}/step/${props.nextStepOrder}?${qs}`
          : `/checkout/${props.funnelSlug}/confirmation?${qs}`
      )
    }

    wrapper.addEventListener('custom-checkout-confirm', handler as EventListener)
    return () => wrapper.removeEventListener('custom-checkout-confirm', handler as EventListener)
  }, [stripe, elements, props, router])

  return (
    <div ref={wrapperRef}>
      <CustomHtmlStep {...props} mode="ORDER_FORM" />
    </div>
  )
}

// Re-export Stripe's loadStripe so callers don't need a second import path.
export { loadStripe }

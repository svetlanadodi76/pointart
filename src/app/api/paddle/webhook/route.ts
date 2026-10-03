import { NextRequest, NextResponse } from 'next/server'
import { Paddle, Environment, EventName } from '@paddle/paddle-node-sdk'
import { createClient } from '@supabase/supabase-js'
import { logSecurity } from '@/lib/supabase/logSecurity'

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
    ? Environment.sandbox
    : Environment.production,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || '']: 'starter',
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || '']: 'pro',
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_PREMIUM || '']: 'premium',
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_TRACKER || '']: 'starter',
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('paddle-signature') ?? ''
  const rawBody = await req.text()

  let event
  try {
    event = await paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET!, signature)
  } catch (err) {
    console.error('[Paddle webhook] Signature verification failed:', err)
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    await logSecurity('paddle_webhook_invalid_sig', ip, `sig=${signature?.slice(0, 20)}`)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  console.log('[Paddle webhook] Event:', event.eventType)

  try {
    switch (event.eventType) {

      // ── Customers ──────────────────────────────────────────────────────────
      case EventName.CustomerCreated:
      case EventName.CustomerUpdated: {
        const customer = event.data
        // Look up user by email to link Paddle customer → our user
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .single()

        await supabase.from('customers').upsert(
          {
            paddle_customer_id: customer.id,
            email: customer.email,
            user_id: profile?.id ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'paddle_customer_id' }
        )
        break
      }

      // ── Transaction completed (one-time / first payment) ───────────────────
      case EventName.TransactionCompleted: {
        const tx = event.data
        const userId = (tx.customData as Record<string, string> | null)?.userId
        if (!userId) break

        const priceId = tx.items?.[0]?.price?.id ?? ''
        const productId = tx.items?.[0]?.price?.productId ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'starter'

        // Link Paddle customer to our user if not already done
        if (tx.customerId) {
          await linkCustomer(tx.customerId, userId, '')
        }

        // One-time purchase (no subscriptionId)
        if (!tx.subscriptionId) {
          await upsertSubscription({
            userId,
            plan,
            status: 'active',
            priceId,
            productId,
            paddleCustomerId: tx.customerId ?? null,
            paddleTransactionId: tx.id,
            currentPeriodEnd: null,
            schemasRemaining: plan === 'starter' ? 3 : null,
          })
        }
        break
      }

      // ── Subscription created ───────────────────────────────────────────────
      case EventName.SubscriptionCreated: {
        const sub = event.data
        const userId = (sub.customData as Record<string, string> | null)?.userId
        if (!userId) break

        const priceId = sub.items?.[0]?.price?.id ?? ''
        const productId = sub.items?.[0]?.price?.productId ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'pro'

        if (sub.customerId) {
          await linkCustomer(sub.customerId, userId, '')
        }

        await upsertSubscription({
          userId,
          plan,
          status: paddleStatusToLocal(sub.status),
          priceId,
          productId,
          paddleSubscriptionId: sub.id,
          paddleCustomerId: sub.customerId ?? null,
          scheduledChangeAction: sub.scheduledChange?.action ?? null,
          scheduledChangeAt: sub.scheduledChange?.effectiveAt ?? null,
          currentPeriodEnd: sub.currentBillingPeriod?.endsAt
            ? new Date(sub.currentBillingPeriod.endsAt).toISOString()
            : null,
          schemasRemaining: null,
        })
        break
      }

      // ── Subscription updated (renewal, plan change, status change) ─────────
      case EventName.SubscriptionUpdated: {
        const sub = event.data
        const userId = (sub.customData as Record<string, string> | null)?.userId
        if (!userId) break

        const priceId = sub.items?.[0]?.price?.id ?? ''
        const productId = sub.items?.[0]?.price?.productId ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'pro'

        await upsertSubscription({
          userId,
          plan,
          status: paddleStatusToLocal(sub.status),
          priceId,
          productId,
          paddleSubscriptionId: sub.id,
          paddleCustomerId: sub.customerId ?? null,
          scheduledChangeAction: sub.scheduledChange?.action ?? null,
          scheduledChangeAt: sub.scheduledChange?.effectiveAt ?? null,
          currentPeriodEnd: sub.currentBillingPeriod?.endsAt
            ? new Date(sub.currentBillingPeriod.endsAt).toISOString()
            : null,
          schemasRemaining: null,
        })
        break
      }

      // ── Subscription canceled ──────────────────────────────────────────────
      case EventName.SubscriptionCanceled: {
        const sub = event.data
        const userId = (sub.customData as Record<string, string> | null)?.userId
        if (!userId) break

        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', userId)
        break
      }
    }
  } catch (err) {
    console.error('[Paddle webhook] Handler error:', err)
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function paddleStatusToLocal(status: string): string {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trialing'
  if (status === 'paused') return 'paused'
  if (status === 'past_due') return 'past_due'
  if (status === 'canceled') return 'cancelled'
  return 'expired'
}

async function linkCustomer(paddleCustomerId: string, userId: string, email: string) {
  await supabase.from('customers').upsert(
    {
      paddle_customer_id: paddleCustomerId,
      user_id: userId,
      email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'paddle_customer_id', ignoreDuplicates: false }
  )
}

async function upsertSubscription({
  userId, plan, status, priceId, productId,
  paddleSubscriptionId, paddleCustomerId, paddleTransactionId,
  scheduledChangeAction, scheduledChangeAt,
  currentPeriodEnd, schemasRemaining,
}: {
  userId: string
  plan: string
  status: string
  priceId?: string
  productId?: string
  paddleSubscriptionId?: string | null
  paddleCustomerId?: string | null
  paddleTransactionId?: string | null
  scheduledChangeAction?: string | null
  scheduledChangeAt?: string | null
  currentPeriodEnd: string | null
  schemasRemaining: number | null
}) {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  const payload: Record<string, unknown> = {
    user_id: userId,
    plan,
    status,
    updated_at: new Date().toISOString(),
    ...(priceId !== undefined && { price_id: priceId }),
    ...(productId !== undefined && { product_id: productId }),
    ...(paddleSubscriptionId !== undefined && { paddle_subscription_id: paddleSubscriptionId }),
    ...(paddleCustomerId !== undefined && { paddle_customer_id: paddleCustomerId }),
    ...(paddleTransactionId !== undefined && { paddle_transaction_id: paddleTransactionId }),
    ...(scheduledChangeAction !== undefined && { scheduled_change_action: scheduledChangeAction }),
    ...(scheduledChangeAt !== undefined && { scheduled_change_at: scheduledChangeAt }),
    ...(currentPeriodEnd !== null && { current_period_end: currentPeriodEnd }),
    ...(schemasRemaining !== null && { schemas_remaining: schemasRemaining }),
  }

  if (existing) {
    await supabase.from('subscriptions').update(payload).eq('user_id', userId)
  } else {
    await supabase.from('subscriptions').insert({ ...payload, created_at: new Date().toISOString() })
  }
}

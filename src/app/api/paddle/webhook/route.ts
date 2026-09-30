import { NextRequest, NextResponse } from 'next/server'
import { Paddle, Environment, EventName } from '@paddle/paddle-node-sdk'
import { createClient } from '@supabase/supabase-js'

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
    ? Environment.sandbox
    : Environment.production,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Map Paddle price IDs → plan names
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_STARTER || '']: 'starter',
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO || '']: 'pro',
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_PREMIUM || '']: 'premium',
  [process.env.NEXT_PUBLIC_PADDLE_PRICE_TRACKER || '']: 'starter', // tracker = starter pentru test
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('paddle-signature') ?? ''
  const rawBody = await req.text()

  let event
  try {
    event = await paddle.webhooks.unmarshal(rawBody, process.env.PADDLE_WEBHOOK_SECRET!, signature)
  } catch {
    console.error('[Paddle webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  console.log('[Paddle webhook] Event:', event.eventType)

  try {
    switch (event.eventType) {

      // Plată unică (Starter) sau prima plată abonament
      case EventName.TransactionCompleted: {
        const tx = event.data
        const userId = tx.customData?.userId as string | undefined
        if (!userId) break

        const priceId = tx.items?.[0]?.price?.id ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'starter'
        const customerId = tx.customerId ?? null
        const txId = tx.id

        // Plată unică (starter) — fără subscription ID
        if (!tx.subscriptionId) {
          await upsertSubscription({
            userId,
            plan,
            status: 'active',
            paddleCustomerId: customerId,
            paddleTransactionId: txId,
            currentPeriodEnd: null,
            schemasRemaining: plan === 'starter' ? 3 : null,
          })
        }
        break
      }

      // Abonament nou creat (Pro / Premium)
      case EventName.SubscriptionCreated: {
        const sub = event.data
        const userId = sub.customData?.userId as string | undefined
        if (!userId) break

        const priceId = sub.items?.[0]?.price?.id ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'pro'

        await upsertSubscription({
          userId,
          plan,
          status: 'active',
          paddleSubscriptionId: sub.id,
          paddleCustomerId: sub.customerId ?? null,
          currentPeriodEnd: sub.currentBillingPeriod?.endsAt
            ? new Date(sub.currentBillingPeriod.endsAt).toISOString()
            : null,
          schemasRemaining: null,
        })
        break
      }

      // Abonament actualizat (reînnoire, upgrade, downgrade)
      case EventName.SubscriptionUpdated: {
        const sub = event.data
        const userId = sub.customData?.userId as string | undefined
        if (!userId) break

        const priceId = sub.items?.[0]?.price?.id ?? ''
        const plan = PRICE_TO_PLAN[priceId] ?? 'pro'
        const status = sub.status === 'active' ? 'active' : 'expired'

        await upsertSubscription({
          userId,
          plan,
          status,
          paddleSubscriptionId: sub.id,
          paddleCustomerId: sub.customerId ?? null,
          currentPeriodEnd: sub.currentBillingPeriod?.endsAt
            ? new Date(sub.currentBillingPeriod.endsAt).toISOString()
            : null,
          schemasRemaining: null,
        })
        break
      }

      // Abonament anulat
      case EventName.SubscriptionCanceled: {
        const sub = event.data
        const userId = sub.customData?.userId as string | undefined
        if (!userId) break

        await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
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

async function upsertSubscription({
  userId,
  plan,
  status,
  paddleSubscriptionId,
  paddleCustomerId,
  paddleTransactionId,
  currentPeriodEnd,
  schemasRemaining,
}: {
  userId: string
  plan: string
  status: string
  paddleSubscriptionId?: string | null
  paddleCustomerId?: string | null
  paddleTransactionId?: string | null
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
    ...(paddleSubscriptionId !== undefined && { paddle_subscription_id: paddleSubscriptionId }),
    ...(paddleCustomerId !== undefined && { paddle_customer_id: paddleCustomerId }),
    ...(paddleTransactionId !== undefined && { paddle_transaction_id: paddleTransactionId }),
    ...(currentPeriodEnd !== undefined && { current_period_end: currentPeriodEnd }),
    ...(schemasRemaining !== null && { schemas_remaining: schemasRemaining }),
  }

  if (existing) {
    await supabase.from('subscriptions').update(payload).eq('user_id', userId)
  } else {
    await supabase.from('subscriptions').insert({ ...payload, created_at: new Date().toISOString() })
  }
}

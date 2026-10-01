import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Paddle, Environment } from '@paddle/paddle-node-sdk'

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
    ? Environment.sandbox
    : Environment.production,
})

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status, paddle_subscription_id')
    .eq('user_id', user.id)
    .single()

  if (!sub) return NextResponse.json({ error: 'Abonament negăsit' }, { status: 404 })

  if (!['pro', 'premium'].includes(sub.plan)) {
    return NextResponse.json({ error: 'Doar Pro și Premium pot fi anulate' }, { status: 400 })
  }

  if (sub.status !== 'active') {
    return NextResponse.json({ error: 'Abonamentul nu este activ' }, { status: 400 })
  }

  if (!sub.paddle_subscription_id) {
    return NextResponse.json({ error: 'ID abonament Paddle negăsit' }, { status: 400 })
  }

  try {
    await paddle.subscriptions.cancel(sub.paddle_subscription_id, {
      effectiveFrom: 'next_billing_period',
    })
  } catch (err) {
    console.error('[Cancel] Paddle error:', err)
    return NextResponse.json({ error: 'Eroare la anulare Paddle' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

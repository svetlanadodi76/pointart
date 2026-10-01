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
    .select('paddle_subscription_id, scheduled_change_action')
    .eq('user_id', user.id)
    .single()

  if (!sub?.paddle_subscription_id) {
    return NextResponse.json({ error: 'Abonament Paddle negăsit' }, { status: 404 })
  }

  if (sub.scheduled_change_action !== 'cancel') {
    return NextResponse.json({ error: 'Nu există anulare programată' }, { status: 400 })
  }

  try {
    // Removes the scheduled cancellation — subscription continues as normal
    await paddle.subscriptions.update(sub.paddle_subscription_id, {
      scheduledChange: null,
    })
  } catch (err) {
    console.error('[Reactivate] Paddle error:', err)
    return NextResponse.json({ error: 'Eroare la reactivare Paddle' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { Paddle, Environment } from '@paddle/paddle-node-sdk'
import { createClient } from '@/lib/supabase/server'

const paddle = new Paddle(process.env.PADDLE_API_KEY!, {
  environment: process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox'
    ? Environment.sandbox
    : Environment.production,
})

export async function GET(_req: NextRequest) {
  // Authenticate server-side — never trust a customer ID from the client
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL!))
  }

  // Resolve Paddle customer ID from our database
  const { data: customer } = await supabase
    .from('customers')
    .select('paddle_customer_id, id')
    .eq('user_id', user.id)
    .single()

  if (!customer?.paddle_customer_id) {
    return NextResponse.redirect(
      new URL('/dashboard?error=no_billing', process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  // Get subscription IDs for this customer
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('paddle_subscription_id')
    .eq('user_id', user.id)
    .single()

  const subscriptionIds = sub?.paddle_subscription_id ? [sub.paddle_subscription_id] : []

  const session = await paddle.customerPortalSessions.create(
    customer.paddle_customer_id,
    subscriptionIds
  )

  return NextResponse.redirect(session.urls.general.overview)
}

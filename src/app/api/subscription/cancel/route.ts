import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  if (!sub) return NextResponse.json({ error: 'Abonament negăsit' }, { status: 404 })

  if (!['pro', 'premium'].includes(sub.plan)) {
    return NextResponse.json({ error: 'Doar abonamentele Pro și Premium pot fi anulate' }, { status: 400 })
  }

  if (sub.status !== 'active') {
    return NextResponse.json({ error: 'Abonamentul nu este activ' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}

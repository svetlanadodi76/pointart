import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendExpiryReminderEmail } from '@/lib/email/resend'

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const before2Days = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  const { data: expiring, error } = await admin
    .from('subscriptions')
    .select('user_id, plan, current_period_end')
    .eq('status', 'active')
    .in('plan', ['pro', 'premium'])
    .gt('current_period_end', now.toISOString())
    .lte('current_period_end', in3Days.toISOString())

  if (error) {
    console.error('Cron query error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!expiring?.length) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const sub of expiring) {
    // Skip dacă am trimis reminder în ultimele 2 zile
    const { data: recent } = await admin
      .from('subscription_logs')
      .select('id')
      .eq('user_id', sub.user_id)
      .eq('event', 'expiry_reminder_sent')
      .gt('created_at', before2Days.toISOString())
      .maybeSingle()

    if (recent) continue

    // Obținem emailul din auth
    const { data: userData } = await admin.auth.admin.getUserById(sub.user_id)
    const userEmail = userData?.user?.email
    if (!userEmail) continue

    try {
      await sendExpiryReminderEmail({
        toEmail: userEmail,
        plan: sub.plan,
        expiresAt: new Date(sub.current_period_end),
      })

      await admin.from('subscription_logs').insert({
        user_id: sub.user_id,
        user_email: userEmail,
        event: 'expiry_reminder_sent',
        plan: sub.plan,
        note: `Expiră ${sub.current_period_end}`,
      })

      sent++
    } catch (err) {
      console.error(`Reminder email failed for ${userEmail}:`, err)
    }
  }

  return NextResponse.json({ sent })
}

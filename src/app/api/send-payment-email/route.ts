import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendPaymentEmail } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { planId, planName, amountEur, amountMdl } = await request.json()

  if (!planId || !planName || !amountEur || !amountMdl) {
    return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })
  }

  try {
    await sendPaymentEmail({ toEmail: user.email, planId, planName, amountEur, amountMdl })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Resend error:', error)
    return NextResponse.json({ error: 'Eroare trimitere email' }, { status: 500 })
  }
}

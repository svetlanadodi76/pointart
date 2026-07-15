import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminPaymentNotification } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  try {
    const { planId, planName, transactionNumber, transactionDate } = await request.json()

    if (!planId || !transactionNumber || !transactionDate) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })
    }

    const admin = createAdminClient()
    const email = user.email!

    await admin.from('payments').insert({
      user_id: user.id,
      user_email: email,
      plan: planId,
      amount_eur: null,
      amount_mdl: null,
      note: `Confirmare client: tranzacție #${transactionNumber}`,
      transaction_number: transactionNumber,
      transaction_date: transactionDate,
      status: 'pending',
    })

    const adminEmail = process.env.CONTACT_EMAIL || 'contact@pointart.art'
    await sendAdminPaymentNotification({
      toEmail: adminEmail,
      userEmail: email,
      planName,
      transactionNumber,
      transactionDate,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('confirm-payment error:', error)
    return NextResponse.json({ error: 'Eroare server' }, { status: 500 })
  }
}

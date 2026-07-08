import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminPaymentNotification } from '@/lib/email/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, planId, planName, transactionNumber, transactionDate } = await request.json()

    if (!email || !planId || !transactionNumber || !transactionDate) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Caută user_id după email
    const { data: users } = await admin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)

    await admin.from('payments').insert({
      user_id: user?.id ?? null,
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

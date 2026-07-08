import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `PointArt <${process.env.CONTACT_EMAIL || 'contact@pointart.art'}>`

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  premium: 'Premium AI',
}

function formatDateRO(date: Date): string {
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function sendActivationEmail({
  toEmail,
  plan,
  periodEnd,
}: {
  toEmail: string
  plan: string
  periodEnd?: Date | null
}) {
  const contactEmail = process.env.CONTACT_EMAIL || 'contact@pointart.art'
  const planLabel = PLAN_LABELS[plan] || plan

  const detailsRow = plan === 'starter'
    ? `<tr><td style="padding:7px 0;color:#6b7280;">Scheme disponibile</td><td style="padding:7px 0;font-weight:700;text-align:right;">3 (fără expirare)</td></tr>`
    : periodEnd
      ? `<tr><td style="padding:7px 0;color:#6b7280;">Valabil până la</td><td style="padding:7px 0;font-weight:700;text-align:right;">${formatDateRO(periodEnd)}</td></tr>`
      : ''

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    replyTo: contactEmail,
    subject: `Planul tău ${planLabel} e activ — PointArt`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
  <div style="text-align:center;padding:32px 0 16px;">
    <div style="font-size:32px;">🧵</div>
    <div style="font-size:22px;font-weight:700;color:#6d28d9;">PointArt</div>
  </div>

  <p>Bună ziua,</p>
  <p>Planul tău <strong>${planLabel}</strong> a fost activat cu succes. Poți genera scheme acum!</p>

  <div style="background:#f5f3ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <p style="margin:0 0 14px;font-size:12px;color:#6d28d9;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Detalii abonament</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:7px 0;color:#6b7280;">Plan activ</td>
        <td style="padding:7px 0;font-weight:700;text-align:right;">${planLabel}</td>
      </tr>
      ${detailsRow}
    </table>
  </div>

  <div style="text-align:center;margin:28px 0;">
    <a href="https://pointart.art/generate" style="background:#6d28d9;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Generează prima schemă →</a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>
  <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">
    Cu drag, <strong>Echipa PointArt</strong><br/>
    <a href="mailto:${contactEmail}" style="color:#6d28d9;">${contactEmail}</a>
  </p>
</div>`,
  })
}

export async function sendExpiryReminderEmail({
  toEmail,
  plan,
  expiresAt,
}: {
  toEmail: string
  plan: string
  expiresAt: Date
}) {
  const contactEmail = process.env.CONTACT_EMAIL || 'contact@pointart.art'
  const planLabel = PLAN_LABELS[plan] || plan

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    replyTo: contactEmail,
    subject: `Abonamentul tău PointArt expiră în 3 zile`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
  <div style="text-align:center;padding:32px 0 16px;">
    <div style="font-size:32px;">🧵</div>
    <div style="font-size:22px;font-weight:700;color:#6d28d9;">PointArt</div>
  </div>

  <p>Bună ziua,</p>
  <p>Abonamentul tău <strong>${planLabel}</strong> expiră pe <strong>${formatDateRO(expiresAt)}</strong>.</p>

  <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <p style="margin:0;font-size:14px;color:#92400e;">
      ⚠️ După expirare nu vei mai putea genera scheme noi. Contactează-ne pentru a reînnoi abonamentul.
    </p>
  </div>

  <div style="text-align:center;margin:28px 0;">
    <a href="https://pointart.art/pricing" style="background:#6d28d9;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Reînnoiește abonamentul →</a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>
  <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">
    Cu drag, <strong>Echipa PointArt</strong><br/>
    <a href="mailto:${contactEmail}" style="color:#6d28d9;">${contactEmail}</a>
  </p>
</div>`,
  })
}

export async function sendPaymentEmail({
  toEmail,
  planId,
  planName,
  amountEur,
  amountMdl,
}: {
  toEmail: string
  planId: string
  planName: string
  amountEur: number
  amountMdl: number
}) {
  const card = process.env.PAYMENT_CARD || ''
  const contactEmail = process.env.CONTACT_EMAIL || 'contact@pointart.art'
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pointart.art'
  const confirmUrl = `${baseUrl}/confirm-payment?email=${encodeURIComponent(toEmail)}&plan=${planId}&planName=${encodeURIComponent(planName)}`

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    replyTo: contactEmail,
    subject: `Detalii plată plan ${planName} — PointArt`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
  <div style="text-align:center;padding:32px 0 16px;">
    <div style="font-size:32px;">🧵</div>
    <div style="font-size:22px;font-weight:700;color:#6d28d9;">PointArt</div>
  </div>

  <p>Bună ziua,</p>
  <p>Ai solicitat activarea planului <strong>${planName}</strong>. Mai jos găsești detaliile pentru transfer:</p>

  <div style="background:#f5f3ff;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <p style="margin:0 0 14px;font-size:12px;color:#6d28d9;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">Detalii transfer</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:7px 0;color:#6b7280;">Număr card</td>
        <td style="padding:7px 0;font-weight:700;text-align:right;">${card}</td>
      </tr>
      <tr>
        <td style="padding:7px 0;color:#6b7280;">Sumă</td>
        <td style="padding:7px 0;font-weight:700;text-align:right;">${amountEur}€ &nbsp;/&nbsp; ${amountMdl} MDL</td>
      </tr>
      <tr style="border-top:1px solid #ddd8fe;">
        <td style="padding:10px 0 4px;color:#6b7280;">Referință obligatorie</td>
        <td style="padding:10px 0 4px;font-weight:700;color:#6d28d9;text-align:right;">${toEmail}</td>
      </tr>
    </table>
  </div>

  <p style="font-size:14px;color:#4b5563;">
    După ce efectuezi transferul, apasă butonul de mai jos și completează numărul tranzacției.<br/>
    Planul se activează în <strong>maxim 24 de ore</strong>.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${confirmUrl}" style="background:#6d28d9;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
      Confirmă plata →
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>
  <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">
    Cu drag, <strong>Echipa PointArt</strong><br/>
    <a href="mailto:${contactEmail}" style="color:#6d28d9;">${contactEmail}</a>
  </p>
</div>`,
  })
}

export async function sendAdminPaymentNotification({
  toEmail,
  userEmail,
  planName,
  transactionNumber,
  transactionDate,
}: {
  toEmail: string
  userEmail: string
  planName: string
  transactionNumber: string
  transactionDate: string
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pointart.art'
  const dateFormatted = new Date(transactionDate).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: `Confirmare plată nouă — ${planName} (${userEmail})`,
    html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
  <div style="text-align:center;padding:32px 0 16px;">
    <div style="font-size:32px;">💰</div>
    <div style="font-size:22px;font-weight:700;color:#6d28d9;">PointArt Admin</div>
  </div>

  <p>Ai primit o nouă confirmare de plată:</p>

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px 24px;margin:24px 0;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr>
        <td style="padding:7px 0;color:#6b7280;">Email utilizator</td>
        <td style="padding:7px 0;font-weight:700;text-align:right;">${userEmail}</td>
      </tr>
      <tr>
        <td style="padding:7px 0;color:#6b7280;">Plan solicitat</td>
        <td style="padding:7px 0;font-weight:700;text-align:right;">${planName}</td>
      </tr>
      <tr style="border-top:1px solid #d1fae5;">
        <td style="padding:10px 0 4px;color:#6b7280;">Număr tranzacție</td>
        <td style="padding:10px 0 4px;font-weight:700;color:#059669;text-align:right;">#${transactionNumber}</td>
      </tr>
      <tr>
        <td style="padding:7px 0;color:#6b7280;">Data transferului</td>
        <td style="padding:7px 0;font-weight:700;text-align:right;">${dateFormatted}</td>
      </tr>
    </table>
  </div>

  <p style="font-size:14px;color:#4b5563;">
    Verifică extrasul de cont și activează abonamentul din panoul admin.
  </p>

  <div style="text-align:center;margin:28px 0;">
    <a href="${baseUrl}/admin" style="background:#6d28d9;color:#fff;padding:13px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;">
      Mergi la Admin →
    </a>
  </div>
</div>`,
  })
}

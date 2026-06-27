import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = `PointArt <${process.env.CONTACT_EMAIL || 'contact@pointart.art'}>`

export async function sendPaymentEmail({
  toEmail,
  planName,
  amountEur,
  amountMdl,
}: {
  toEmail: string
  planName: string
  amountEur: number
  amountMdl: number
}) {
  const card = process.env.PAYMENT_CARD || ''
  const contactEmail = process.env.CONTACT_EMAIL || 'contact@pointart.art'

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
    După ce efectuezi transferul, <strong>răspunde la acest email</strong> cu confirmarea plății.<br/>
    Planul se activează în <strong>maxim 24 de ore</strong>.
  </p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;"/>
  <p style="font-size:13px;color:#9ca3af;text-align:center;margin:0;">
    Cu drag, <strong>Echipa PointArt</strong><br/>
    <a href="mailto:${contactEmail}" style="color:#6d28d9;">${contactEmail}</a>
  </p>
</div>`,
  })
}

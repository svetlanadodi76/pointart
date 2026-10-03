import { createAdminClient } from './admin'

export type SecurityEvent =
  | 'login_failed'
  | 'register_failed'
  | 'generation_failed'
  | 'generation_blocked'
  | 'admin_pin_failed'
  | 'paddle_webhook_invalid_sig'

// Events that trigger an immediate email alert to the admin
const CRITICAL_EVENTS: SecurityEvent[] = ['admin_pin_failed', 'paddle_webhook_invalid_sig']

export async function logSecurity(
  event: SecurityEvent,
  email: string,
  details?: string
) {
  try {
    const admin = createAdminClient()
    await admin.from('security_logs').insert({
      event,
      email,
      details: details ?? null,
    })
  } catch {
    // non-critical — don't block the main flow
  }

  if (CRITICAL_EVENTS.includes(event)) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `PointArt Security <${process.env.CONTACT_EMAIL || 'contact@pointart.art'}>`,
          to: [process.env.ADMIN_EMAIL!],
          subject: `⚠️ Alert securitate PointArt: ${event}`,
          text: `Eveniment: ${event}\nEmail/sursă: ${email}\nDetalii: ${details ?? '—'}\nOra (UTC): ${new Date().toISOString()}`,
        }),
      })
    } catch {
      // email alert non-critical — don't throw
    }
  }
}

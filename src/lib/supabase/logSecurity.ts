import { createAdminClient } from './admin'

export type SecurityEvent =
  | 'login_failed'
  | 'register_failed'
  | 'generation_failed'
  | 'generation_blocked'
  | 'admin_pin_failed'

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
    // nu blocăm fluxul principal dacă logging-ul eșuează
  }
}

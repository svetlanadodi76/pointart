import { createAdminClient } from './admin'

export interface AppSettings {
  admin_pin_hash: string
  starter_schemas: string
  trial_days: string
  whatsapp_message: string
}

const DEFAULTS: AppSettings = {
  admin_pin_hash: '',
  starter_schemas: '3',
  trial_days: '5',
  whatsapp_message: 'Bună! Am efectuat transferul pentru planul {plan} PointArt ({eur}€ / {mdl} MDL).\nEmail cont: {email}',
}

export async function getAppSettings(): Promise<AppSettings> {
  const admin = createAdminClient()
  const { data } = await admin.from('app_settings').select('key, value')
  if (!data) return DEFAULTS
  const map = Object.fromEntries(data.map((r: { key: string; value: string }) => [r.key, r.value]))
  return { ...DEFAULTS, ...map } as AppSettings
}

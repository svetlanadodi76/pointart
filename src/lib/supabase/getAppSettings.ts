import { createAdminClient } from './admin'

export interface AppSettings {
  admin_pin_hash: string
  payment_iban: string
  payment_name: string
  payment_bank: string
  payment_contact: string
  starter_schemas: string
  trial_days: string
  whatsapp_message: string
}

const DEFAULTS: AppSettings = {
  admin_pin_hash: '',
  payment_iban: '',
  payment_name: '',
  payment_bank: '',
  payment_contact: '',
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

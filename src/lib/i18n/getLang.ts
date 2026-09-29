import { cookies } from 'next/headers'
import type { Lang } from './translations'

export async function getLang(): Promise<Lang> {
  const cookieStore = await cookies()
  const val = cookieStore.get('lang')?.value
  if (val === 'ru') return 'ru'
  if (val === 'en') return 'en'
  return 'ro'
}

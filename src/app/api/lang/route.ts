import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { lang } = await request.json()
  const value = lang === 'ru' ? 'ru' : 'ro'

  const response = NextResponse.json({ ok: true })
  response.cookies.set('lang', value, {
    httpOnly: false, // accesibil din JS pentru LanguageToggle
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 an
  })
  return response
}

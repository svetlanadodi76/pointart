import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()
    if (!path || typeof path !== 'string' || path.length > 200) {
      return NextResponse.json({ ok: false })
    }
    const admin = createAdminClient()
    await admin.from('page_views').insert({ path })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}

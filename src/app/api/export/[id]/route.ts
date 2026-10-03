import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import type { GeneratedSchema } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const subscription = await getSubscription(supabase, user.id)
  const canDownload = subscription?.plan === 'starter' || subscription?.plan === 'pro' || subscription?.plan === 'premium'
  if (!canDownload) return NextResponse.json({ error: 'Plan plătit necesar' }, { status: 403 })

  const { data: schema } = await supabase
    .from('schemas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!schema) return NextResponse.json({ error: 'Schemă negăsită' }, { status: 404 })

  const schemaData = schema.schema_data as GeneratedSchema
  const name = (schema.name as string).replace(/[^\w\s\-_.()]/g, '').replace(/\s+/g, '-') || 'schema'
  const filename = `${name}-schema.json`

  const exported = {
    craftType: schema.craft_type,
    ...schemaData,
  }

  return new NextResponse(JSON.stringify(exported), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}

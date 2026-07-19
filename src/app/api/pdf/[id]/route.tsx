import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { SchemaPDF } from '@/lib/pdf/SchemaPDF'
import { FabricPDF } from '@/lib/pdf/FabricPDF'
import type { GeneratedSchema, CraftType, CanvasType } from '@/types'
import React from 'react'

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

  const type = request.nextUrl.searchParams.get('type') ?? 'schema'
  const schemaData = schema.schema_data as GeneratedSchema
  const craftType = schema.craft_type as CraftType
  const canvasType = (schema.canvas_type ?? '14CT') as CanvasType
  const name = schema.name as string

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = (type === 'fabric'
      ? React.createElement(FabricPDF, { schema: schemaData, name, craftType, canvasType })
      : React.createElement(SchemaPDF, { schema: schemaData, name, craftType, canvasType })
    ) as any

    const buffer = await renderToBuffer(doc)
    const filename = `${name.replace(/\s+/g, '-')}-${type}.pdf`
    const body = new Uint8Array(buffer)

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (err) {
    console.error('[PDF] generation failed:', err)
    return NextResponse.json(
      { error: 'Eroare la generarea PDF. Încearcă din nou sau contactează suportul.' },
      { status: 500 }
    )
  }
}

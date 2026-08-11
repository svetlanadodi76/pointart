import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Verifică că schema aparține utilizatorului curent
  const { data: schema } = await supabase
    .from('schemas')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!schema) {
    return NextResponse.json({ error: 'Schemă negăsită' }, { status: 404 })
  }

  const { error } = await supabase
    .from('schemas')
    .update({ color_overrides: body })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

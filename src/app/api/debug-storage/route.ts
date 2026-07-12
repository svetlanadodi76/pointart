import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'neautorizat' }, { status: 401 })

  const { data: schemas } = await supabase
    .from('schemas')
    .select('id, original_image_url, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const paths = (schemas ?? []).map(s => s.original_image_url).filter(Boolean) as string[]

  const admin = createAdminClient()

  // List files in bucket
  const { data: files, error: listError } = await admin.storage.from('images').list(user.id)

  // Try signed URLs
  const { data: signedData, error: signedError } = paths.length > 0
    ? await admin.storage.from('images').createSignedUrls(paths, 3600)
    : { data: null, error: null }

  return NextResponse.json({
    userId: user.id,
    schemaPaths: paths,
    filesInStorage: files ?? [],
    listError: listError?.message ?? null,
    signedUrls: signedData ?? [],
    signedError: signedError?.message ?? null,
  })
}

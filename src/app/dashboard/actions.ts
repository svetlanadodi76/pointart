'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteSchema(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('schemas').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard')
}

export async function updateSchemaFolder(id: string, folder: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('schemas').update({ folder }).eq('id', id).eq('user_id', user.id)
  revalidatePath('/dashboard')
}

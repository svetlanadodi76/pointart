'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function deleteSchemaAction(schemaId: string, currentPageId: string, redirectAfterDelete?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('schemas').delete().eq('id', schemaId).eq('user_id', user.id)

  if (schemaId === currentPageId) {
    redirect(redirectAfterDelete ?? '/dashboard')
  } else {
    revalidatePath(`/dashboard/${currentPageId}`)
  }
}

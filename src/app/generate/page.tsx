import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { redirect } from 'next/navigation'
import GenerateForm from './GenerateForm'

export default async function GeneratePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const subscription = await getSubscription(supabase, user.id)

  // Dacă expirat, trimite la dashboard unde se vede bannerul
  if (!subscription || subscription.status === 'expired') {
    redirect('/dashboard')
  }

  return <GenerateForm subscription={subscription} />
}

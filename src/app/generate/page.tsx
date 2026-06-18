import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { getLang } from '@/lib/i18n/getLang'
import { redirect } from 'next/navigation'
import GenerateForm from './GenerateForm'

export default async function GeneratePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [subscription, lang] = await Promise.all([
    getSubscription(supabase, user.id),
    getLang(),
  ])

  // Dacă expirat, trimite la dashboard unde se vede bannerul
  if (!subscription || subscription.status === 'expired') {
    redirect('/dashboard')
  }

  return <GenerateForm subscription={subscription} lang={lang} />
}

'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logSecurity } from '@/lib/supabase/logSecurity'

export async function login(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: formData.get('password') as string,
  })

  if (error) {
    await logSecurity('login_failed', email, error.message)
    redirect('/auth/login?error=Date+incorecte')
  }

  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.signUp({
    email,
    password: formData.get('password') as string,
    options: { data: { full_name: formData.get('name') as string } },
  })

  if (error) {
    await logSecurity('register_failed', email, error.message)
    redirect('/auth/register?error=' + encodeURIComponent(error.message))
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
    { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password` }
  )

  if (error) {
    redirect('/auth/forgot-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/auth/forgot-password?success=1')
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (password !== confirm) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Parolele nu coincid'))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    redirect('/auth/reset-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/dashboard')
}

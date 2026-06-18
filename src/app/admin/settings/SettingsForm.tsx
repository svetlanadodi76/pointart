'use client'

import { useState, useTransition } from 'react'
import { savePaymentSettings, savePlanSettings, changePin } from './actions'
import type { AppSettings } from '@/lib/supabase/getAppSettings'

export function SettingsForm({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState<string | null>(null)
  const [pinError, setPinError] = useState('')

  const handleSave = (action: (fd: FormData) => Promise<unknown>, section: string) =>
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setSaved(null)
      startTransition(async () => {
        await action(new FormData(e.currentTarget))
        setSaved(section)
        setTimeout(() => setSaved(null), 3000)
      })
    }

  const handlePinChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPinError('')
    setSaved(null)
    startTransition(async () => {
      const res = await changePin(new FormData(e.currentTarget)) as { error?: string; success?: boolean }
      if (res?.error) setPinError(res.error)
      else { setSaved('pin'); setTimeout(() => setSaved(null), 3000) }
    })
  }

  return (
    <div className="space-y-8">

      {/* Date bancare */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Date bancare & plată</h2>
        <form onSubmit={handleSave(savePaymentSettings, 'payment')} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="IBAN" name="payment_iban" defaultValue={settings.payment_iban} />
            <Field label="Beneficiar" name="payment_name" defaultValue={settings.payment_name} />
            <Field label="Bancă" name="payment_bank" defaultValue={settings.payment_bank} />
            <Field label="Contact WhatsApp" name="payment_contact" defaultValue={settings.payment_contact} />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mesaj WhatsApp</label>
            <textarea
              name="whatsapp_message"
              defaultValue={settings.whatsapp_message}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">Variabile: {'{plan}'} {'{eur}'} {'{mdl}'} {'{email}'}</p>
          </div>
          <SaveButton isPending={isPending} saved={saved === 'payment'} />
        </form>
      </section>

      {/* Limite planuri */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Limite planuri</h2>
        <form onSubmit={handleSave(savePlanSettings, 'plan')} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Field label="Scheme incluse în Starter" name="starter_schemas" defaultValue={settings.starter_schemas} type="number" />
              <p className="text-xs text-gray-400 mt-1">Numărul de scheme pe care le poate genera un utilizator Starter</p>
            </div>
            <div>
              <Field label="Zile trial gratuit" name="trial_days" defaultValue={settings.trial_days} type="number" />
              <p className="text-xs text-gray-400 mt-1">Numărul de zile pentru perioada de trial</p>
            </div>
          </div>
          <SaveButton isPending={isPending} saved={saved === 'plan'} />
        </form>
      </section>

      {/* Schimbare PIN */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-5">Schimbare PIN admin</h2>
        <form onSubmit={handlePinChange} className="space-y-4 max-w-sm">
          <Field label="PIN curent" name="current_pin" type="password" placeholder="••••" />
          <Field label="PIN nou" name="new_pin" type="password" placeholder="••••" />
          <Field label="Confirmă PIN nou" name="confirm_pin" type="password" placeholder="••••" />
          {pinError && <p className="text-sm text-red-600">{pinError}</p>}
          <SaveButton isPending={isPending} saved={saved === 'pin'} label="Schimbă PIN" />
        </form>
      </section>

    </div>
  )
}

function Field({ label, name, defaultValue = '', type = 'text', placeholder = '' }: {
  label: string; name: string; defaultValue?: string; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 mb-1 block">{label}</label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-300"
      />
    </div>
  )
}

function SaveButton({ isPending, saved, label = 'Salvează' }: { isPending: boolean; saved: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={isPending}
        className="bg-violet-700 hover:bg-violet-800 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {isPending ? 'Se salvează...' : label}
      </button>
      {saved && <span className="text-sm text-green-600 font-medium">✓ Salvat</span>}
    </div>
  )
}

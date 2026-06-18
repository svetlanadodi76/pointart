'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import type { Lang } from '@/lib/i18n/translations'

interface Props {
  lang: Lang
}

export function LanguageToggle({ lang }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function switchLang(newLang: Lang) {
    await fetch('/api/lang', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: newLang }),
    })
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5" aria-label="Limbă / Язык">
      <button
        onClick={() => switchLang('ro')}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
          lang === 'ro'
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        title="Română"
      >
        RO
      </button>
      <button
        onClick={() => switchLang('ru')}
        disabled={isPending}
        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
          lang === 'ru'
            ? 'bg-white text-violet-700 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
        title="Русский"
      >
        RU
      </button>
    </div>
  )
}

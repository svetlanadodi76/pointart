'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('PointArt error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        <div className="text-7xl mb-6">⚠️</div>
        <p className="text-sm font-semibold text-red-500 uppercase tracking-widest mb-2">Eroare neașteptată</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Ceva nu a mers bine</h1>
        <p className="text-gray-500 mb-8">
          A apărut o eroare neașteptată. Încearcă din nou sau contactează-ne
          dacă problema persistă.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-violet-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-800 transition-colors"
          >
            Încearcă din nou
          </button>
          <Link
            href="/dashboard"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            Dashboard →
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-xs text-gray-400">Cod eroare: {error.digest}</p>
        )}
      </div>
    </div>
  )
}

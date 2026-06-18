import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pagina nu a fost găsită' }

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-md">
        {/* Icon */}
        <div className="text-7xl mb-6">🧵</div>

        {/* Cod eroare */}
        <p className="text-sm font-semibold text-violet-600 uppercase tracking-widest mb-2">Eroare 404</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Pagina nu a fost găsită</h1>
        <p className="text-gray-500 mb-8">
          Se pare că această pagină nu există sau a fost mutată.
          Verifică adresa sau întoarce-te acasă.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="bg-violet-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-800 transition-colors"
          >
            Pagina principală
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium hover:border-violet-300 hover:text-violet-700 transition-colors"
          >
            Dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'
import { resetPassword } from '../actions'

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🧵</span>
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Parolă nouă</h1>
          <p className="text-gray-500 mt-2">Alege o parolă nouă pentru contul tău</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={resetPassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Parolă nouă
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Minim 6 caractere"
              minLength={6}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmă parola
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              placeholder="Repetă parola nouă"
              minLength={6}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-700 text-white py-3 rounded-xl font-semibold hover:bg-violet-800 transition-colors"
          >
            Salvează parola nouă
          </button>
        </form>
      </div>
    </div>
  )
}

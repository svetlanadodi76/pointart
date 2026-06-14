import Link from 'next/link'
import { login } from '../actions'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-2xl">🧵</span>
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Bun venit înapoi</h1>
          <p className="text-gray-500 mt-2">Intră în contul tău</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={login} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="adresa@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Parolă
              </label>
              <Link href="/auth/forgot-password" className="text-sm text-violet-600 hover:underline">
                Ai uitat parola?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-violet-700 text-white py-3 rounded-xl font-semibold hover:bg-violet-800 transition-colors"
          >
            Intră în cont
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          Nu ai cont?{' '}
          <Link href="/auth/register" className="text-violet-700 font-medium hover:underline">
            Înregistrează-te gratuit
          </Link>
        </p>
      </div>
    </div>
  )
}

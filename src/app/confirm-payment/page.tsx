import Image from 'next/image'
import { ConfirmForm } from './ConfirmForm'

export default async function ConfirmPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; plan?: string; planName?: string }>
}) {
  const params = await searchParams
  const email = params.email ?? ''
  const planId = params.plan ?? ''
  const planName = params.planName ?? planId

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Image src="/logo.jpg" alt="PointArt" width={36} height={36} className="rounded-full" />
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Confirmă plata</h1>
          <p className="text-sm text-gray-500 mt-1">
            Completează datele transferului pentru a activa abonamentul.
          </p>
        </div>

        <ConfirmForm email={email} planId={planId} planName={planName} />

        <p className="text-xs text-gray-400 text-center mt-6">
          Întrebări? Scrie-ne la{' '}
          <a href="mailto:contact@pointart.art" className="text-violet-600 hover:underline">
            contact@pointart.art
          </a>
        </p>
      </div>
    </div>
  )
}

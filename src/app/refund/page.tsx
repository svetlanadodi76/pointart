import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Politică de rambursare',
}

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🧵</span>
            <span className="font-bold text-violet-700">PointArt</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 text-sm">Politică de rambursare</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politică de rambursare</h1>
        <p className="text-gray-400 text-sm mb-10">Ultima actualizare: septembrie 2026 · Versiunea 1.0</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <p>
            Ne dorim să fii mulțumit de PointArt. Dacă ceva nu a funcționat cum te așteptai,
            poți solicita o rambursare conform condițiilor de mai jos.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Plan Starter — plată unică (5€)</h2>
            <p>
              Oferim rambursare completă în <strong>14 zile</strong> de la data plății, fără întrebări
              suplimentare, dacă nu ai descărcat mai mult de 3 scheme PDF.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Planuri Pro și Premium — abonament lunar</h2>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Prima perioadă de facturare</h3>
            <p>
              Dacă ești nemulțumit după prima plată lunară, poți solicita rambursare completă în{' '}
              <strong>14 zile de la activare</strong>.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Perioadele următoare</h3>
            <p>
              Perioadele de facturare deja plătite nu se rambursează. La anularea abonamentului,
              accesul rămâne activ până la sfârșitul perioadei curente plătite.
            </p>

            <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Anularea abonamentului</h3>
            <p>
              Poți anula oricând din secțiunea <strong>Contul meu</strong>. Anularea intră în vigoare
              la finalul perioadei curente — nu se mai percepe nicio sumă ulterioară.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Când nu se acordă rambursare</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Ai descărcat mai mult de 3 scheme PDF în perioada pentru care soliciți rambursarea.</li>
              <li>Contul a fost suspendat ca urmare a încălcării termenilor și condițiilor.</li>
              <li>Au trecut mai mult de 14 zile de la plată.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cum soliciți rambursarea</h2>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                Trimite un email la{' '}
                <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">
                  contact@pointart.md
                </a>{' '}
                cu subiectul <strong>„Rambursare [Starter / Pro / Premium]"</strong>.
              </li>
              <li>
                Include adresa de email a contului tău și motivul solicitării
                (opțional, dar util pentru noi).
              </li>
              <li>
                Răspundem în <strong>2–3 zile lucrătoare</strong> și inițiem rambursarea prin Paddle.
              </li>
              <li>
                Suma apare pe cardul tău în <strong>5–10 zile bancare</strong>, în funcție de bancă.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
            <p>
              Ai o situație specială? Scrie-ne la{' '}
              <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">
                contact@pointart.md
              </a>{' '}
              — analizăm fiecare caz individual și facem tot posibilul să găsim o soluție corectă.
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

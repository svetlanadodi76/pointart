import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Termeni și condiții',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🧵</span>
            <span className="font-bold text-violet-700">PointArt</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 text-sm">Termeni și condiții</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Termeni și condiții</h1>
        <p className="text-gray-400 text-sm mb-10">Ultima actualizare: septembrie 2026 · Versiunea 1.0</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <p>
            Prin utilizarea platformei PointArt.art ești de acord cu termenii de mai jos.
            Te rugăm să îi citești înainte de a folosi serviciul.
          </p>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Descrierea serviciului</h2>
            <p>
              PointArt.art este o platformă online care generează automat scheme de broderie
              (cross-stitch, goblen, diamante, mini cros) pe baza fotografiilor încărcate de utilizator.
              Serviciul este operat de o persoană fizică cu sediul în Republica Moldova.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Condiții de utilizare</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trebuie să ai cel puțin 18 ani sau să ai acordul unui tutore legal.</li>
              <li>Ești responsabil pentru securitatea și confidențialitatea contului tău.</li>
              <li>Nu este permisă crearea mai multor conturi pentru a beneficia de trial gratuit în mod repetat.</li>
              <li>Nu este permisă utilizarea serviciului pentru scopuri ilegale sau care încalcă drepturile de autor.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Planuri și plăți</h2>
            <p>PointArt oferă următoarele planuri de acces:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Free Trial</strong> — 5 zile acces gratuit la toate funcționalitățile.</li>
              <li><strong>Starter (5€)</strong> — plată unică, acces nelimitat la funcționalitățile de bază.</li>
              <li><strong>Pro (10€/lună)</strong> — abonament lunar recurent.</li>
              <li><strong>Premium (25€/lună)</strong> — abonament lunar recurent cu funcționalități avansate.</li>
            </ul>
            <p className="mt-3">
              Plățile sunt procesate de <strong>Paddle.com</strong>, Merchant of Record al serviciului nostru.
              Pe extrasul bancar va apărea <em>PADDLE.NET*</em> sau similar. Paddle este responsabil pentru
              colectarea taxelor (TVA) conform legislației aplicabile în țara ta.
            </p>
            <p className="mt-3">
              Abonamentele Pro și Premium se reînnoiesc automat lunar. Poți anula oricând din
              contul tău — accesul rămâne activ până la sfârșitul perioadei plătite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Drepturile asupra schemelor generate</h2>
            <p>
              Schemele de broderie generate pe baza fotografiilor tale îți aparțin integral.
              Le poți folosi personal sau comercial fără restricții. PointArt.art nu revendică
              niciun drept asupra conținutului generat de utilizatori.
            </p>
            <p className="mt-3">
              Fotografiile încărcate nu sunt stocate permanent — sunt procesate pentru generarea
              schemei și șterse ulterior din sistemele noastre.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Limitările serviciului</h2>
            <p>
              Serviciul este oferit „ca atare" (<em>as-is</em>). Nu garantăm disponibilitate 100%
              sau că schemele generate vor fi perfecte pentru orice tip de fotografie. Nu suntem
              responsabili pentru pierderile indirecte rezultate din utilizarea sau indisponibilitatea serviciului.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Modificări ale termenilor</h2>
            <p>
              Ne rezervăm dreptul de a modifica acești termeni. Modificările semnificative vor fi
              comunicate prin email cu cel puțin 14 zile înainte de intrarea în vigoare.
              Continuarea utilizării serviciului după această dată constituie acceptarea noilor termeni.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Guvernare și litigii</h2>
            <p>
              Acești termeni sunt guvernați de legislația Republicii Moldova. Orice litigiu va fi
              soluționat în instanțele competente din Republica Moldova.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
            <p>
              Pentru orice întrebări legate de acești termeni, scrie-ne la{' '}
              <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">
                contact@pointart.md
              </a>.
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

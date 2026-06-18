import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Politică de confidențialitate',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🧵</span>
            <span className="font-bold text-violet-700">PointArt</span>
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500 text-sm">Politică de confidențialitate</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politică de confidențialitate</h1>
        <p className="text-gray-400 text-sm mb-10">Ultima actualizare: iunie 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Cine suntem</h2>
            <p>
              PointArt este un serviciu online care generează scheme pentru lucrări manuale (broderie,
              goblene, picturi cu diamante) din fotografii. Serviciul este operat de Dodi Svetlana,
              Republica Moldova. Contact: <a href="mailto:svetlanadodi76@gmail.com" className="text-violet-600 hover:underline">svetlanadodi76@gmail.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Ce date colectăm</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Adresa de email</strong> — la înregistrare și autentificare, folosită pentru comunicări legate de cont.</li>
              <li><strong>Imaginile încărcate</strong> — fotografiile pe care le încarci pentru a genera scheme. Sunt stocate securizat în Supabase Storage.</li>
              <li><strong>Schemele generate</strong> — datele schemei (culori, simboluri, dimensiuni) sunt salvate în contul tău.</li>
              <li><strong>Date de plată</strong> — suma și moneda plăților efectuate (fără date de card; plățile se fac prin transfer bancar).</li>
              <li><strong>Jurnale tehnice</strong> — date anonime despre erori și performanță, pentru menținerea serviciului.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cum folosim datele</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Furnizarea serviciului: generare și stocare scheme, gestionarea abonamentului.</li>
              <li>Comunicări privind contul: confirmare înregistrare, notificări despre abonament.</li>
              <li>Suport tehnic: răspunsuri la solicitările tale.</li>
              <li>Îmbunătățirea serviciului: analiza erorilor tehnice (date anonimizate).</li>
            </ul>
            <p className="mt-3">Nu vindem, nu închiriem și nu partajăm datele tale cu terți în scopuri de marketing.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cât timp păstrăm datele</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Datele contului și schemele</strong> — pe durata existenței contului tău.</li>
              <li><strong>Imaginile originale</strong> — stocate până la ștergerea schemei sau a contului.</li>
              <li><strong>Jurnalele de securitate</strong> — maximum 90 de zile.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Furnizorii noștri de servicii</h2>
            <p>Folosim următoarele servicii terțe pentru operarea PointArt:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Supabase</strong> — bază de date și autentificare (UE/SUA). <a href="https://supabase.com/privacy" className="text-violet-600 hover:underline" target="_blank" rel="noopener">Politica Supabase →</a></li>
              <li><strong>Vercel</strong> — găzduire aplicație (SUA). <a href="https://vercel.com/legal/privacy-policy" className="text-violet-600 hover:underline" target="_blank" rel="noopener">Politica Vercel →</a></li>
            </ul>
            <p className="mt-3">Acești furnizori au acces la date strict în măsura necesară prestării serviciului lor.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Drepturile tale</h2>
            <p>Conform Legii nr. 133/2011 privind protecția datelor cu caracter personal (Republica Moldova) ai dreptul să:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Accesezi datele pe care le deținem despre tine.</li>
              <li>Corectezi datele inexacte.</li>
              <li>Soliciți ștergerea datelor tale (dreptul la uitare).</li>
              <li>Restricționezi prelucrarea datelor în anumite circumstanțe.</li>
              <li>Portezi datele tale (export în format structurat).</li>
            </ul>
            <p className="mt-3">
              Pentru a exercita aceste drepturi, contactează-ne la{' '}
              <a href="mailto:svetlanadodi76@gmail.com" className="text-violet-600 hover:underline">svetlanadodi76@gmail.com</a>.
              Vom răspunde în maximum 30 de zile.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Cookie-uri</h2>
            <p>Folosim cookie-uri strict necesare funcționării serviciului:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Cookie de sesiune autentificare</strong> — pentru a menține starea autentificată.</li>
              <li><strong>Cookie preferință limbă</strong> — pentru a reține alegerea limbii (română/rusă).</li>
              <li><strong>Cookie sesiune admin</strong> — pentru accesul securizat în panoul de administrare.</li>
            </ul>
            <p className="mt-3">Nu folosim cookie-uri de tracking sau publicitate.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Securitate</h2>
            <p>
              Aplicăm măsuri tehnice și organizatorice pentru protecția datelor: criptare în tranzit (HTTPS),
              autentificare securizată (Supabase Auth), acces restricționat la datele sensibile prin politici RLS,
              monitorizare tentative de acces neautorizat.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Modificări ale politicii</h2>
            <p>
              Putem actualiza această politică periodic. Modificările semnificative vor fi comunicate
              prin email sau prin anunț în aplicație. Continuarea utilizării serviciului după notificare
              constituie acceptul modificărilor.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact</h2>
            <p>
              Pentru orice întrebări privind confidențialitatea datelor:{' '}
              <a href="mailto:svetlanadodi76@gmail.com" className="text-violet-600 hover:underline">
                svetlanadodi76@gmail.com
              </a>
            </p>
          </section>

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

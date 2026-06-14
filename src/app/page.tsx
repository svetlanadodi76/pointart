import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧵</span>
            <span className="text-xl font-bold text-violet-700">PointArt</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-violet-700 font-medium transition-colors">
              Intră în cont
            </Link>
            <Link href="/auth/register" className="bg-violet-700 text-white px-4 py-2 rounded-lg font-medium hover:bg-violet-800 transition-colors">
              Încearcă gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span>✨</span>
          <span>5 zile gratuit — fără card bancar</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Transformă orice fotografie<br />
          în <span className="text-violet-700">schemă pentru lucrări manuale</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Generează scheme profesionale pentru broderie, goblene și picturi cu diamante.
          Cu culori DMC exacte, riglă 10×10 și calcul automat de materiale.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/auth/register" className="bg-violet-700 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-violet-800 transition-colors">
            Începe gratuit
          </Link>
          <Link href="#cum-functioneaza" className="text-gray-600 hover:text-violet-700 font-medium transition-colors">
            Cum funcționează →
          </Link>
        </div>
      </section>

      {/* Cum functioneaza */}
      <section id="cum-functioneaza" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Cum funcționează</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '📷', title: 'Încarci fotografia', desc: 'Orice poză de pe telefon sau calculator' },
              { step: '2', icon: '⚙️', title: 'Alegi setările', desc: 'Tip lucrare, dimensiune, număr culori, tip canvas' },
              { step: '3', icon: '📄', title: 'Descarci schema PDF', desc: 'Cu simboluri, culori DMC și cantitatea de ață necesară' },
            ].map(item => (
              <div key={item.step} className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="w-8 h-8 bg-violet-700 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Ce include schema generată</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '🎨', text: 'Culori DMC potrivite exact din 500+ nuanțe' },
              { icon: '📏', text: 'Grilă cu riglă 10×10 pentru numărare ușoară' },
              { icon: '🧵', text: 'Calcul automat de ață — câte seturi din fiecare culoare' },
              { icon: '📐', text: 'Canvas 11CT sau 14CT cu număr fire recomandat' },
              { icon: '🔢', text: 'Simboluri unice pentru fiecare culoare' },
              { icon: '📦', text: 'Variante de dimensiuni propuse automat' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-gray-700 font-medium">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Preturi */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Prețuri simple</h2>
          <p className="text-center text-gray-500 mb-12">Începi gratuit, plătești doar dacă îți place</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Trial</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">Gratuit</div>
              <div className="text-gray-500 text-sm mb-6">5 zile</div>
              <ul className="space-y-3 mb-8">
                {['1 schemă generată', 'Previzualizare în browser', 'Toate tipurile de lucrări'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
                <li className="flex items-center gap-2 text-gray-400">
                  <span>✗</span>Descărcare PDF
                </li>
              </ul>
              <Link href="/auth/register" className="block text-center bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
                Începe gratuit
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-2">Starter</div>
              <div className="text-3xl font-bold text-gray-900 mb-1">5€</div>
              <div className="text-gray-500 text-sm mb-6">3 scheme — o singură dată</div>
              <ul className="space-y-3 mb-8">
                {['3 scheme cu PDF', 'Toate tipurile de lucrări', 'Calcul materiale', 'Fără abonament'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-gray-600">
                    <span className="text-green-500">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="block text-center bg-violet-100 text-violet-700 py-3 rounded-xl font-medium hover:bg-violet-200 transition-colors">
                Cumpără
              </Link>
            </div>

            <div className="bg-violet-700 rounded-2xl p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-sm font-semibold text-violet-200 uppercase tracking-wide mb-2">Pro</div>
              <div className="text-3xl font-bold text-white mb-1">8€</div>
              <div className="text-violet-200 text-sm mb-6">pe lună</div>
              <ul className="space-y-3 mb-8">
                {['Scheme nelimitate', 'PDF descărcabil', 'Toate tipurile de lucrări', 'Calcul materiale', 'Prioritate suport'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-violet-100">
                    <span className="text-green-300">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/register" className="block text-center bg-white text-violet-700 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors">
                Abonează-te
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>🧵</span>
            <span className="font-semibold text-gray-700">PointArt</span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 PointArt. Toate drepturile rezervate.</p>
        </div>
      </footer>
    </main>
  )
}

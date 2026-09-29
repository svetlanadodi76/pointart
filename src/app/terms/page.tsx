import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'
import { LanguageToggle } from '@/components/LanguageToggle'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'

export const metadata: Metadata = {
  title: 'Terms and Conditions — PointArt',
}

export default async function TermsPage() {
  const lang = await getLang()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">🧵</span>
              <span className="font-bold text-violet-700">PointArt</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500 text-sm">{t(lang, 'legal.terms_title')}</span>
          </div>
          <LanguageToggle lang={lang} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t(lang, 'legal.terms_title')}</h1>
        <p className="text-gray-400 text-sm mb-10">{t(lang, 'legal.last_updated')}: {lang === 'en' ? 'September 2026 · Version 1.0' : lang === 'ru' ? 'Сентябрь 2026 · Версия 1.0' : 'Septembrie 2026 · Versiunea 1.0'}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          {lang === 'en' ? (
            <>
              <p>By using the PointArt.art platform you agree to the terms below. Please read them before using the service.</p>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Service description</h2>
                <p>PointArt.art is an online platform that automatically generates embroidery patterns (cross-stitch, tapestry, diamond painting, mini-cross) from user-uploaded photographs. The service is operated by an individual based in the Republic of Moldova.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Terms of use</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You must be at least 18 years old or have the consent of a legal guardian.</li>
                  <li>You are responsible for the security and confidentiality of your account.</li>
                  <li>Creating multiple accounts to repeatedly access the free trial is not permitted.</li>
                  <li>Using the service for illegal purposes or in violation of copyright is not permitted.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Plans and payments</h2>
                <p>PointArt offers the following access plans:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Free Trial</strong> — 5 days free access to all features.</li>
                  <li><strong>Starter (5€)</strong> — one-time payment, unlimited access to basic features.</li>
                  <li><strong>Pro (10€/month)</strong> — recurring monthly subscription.</li>
                  <li><strong>Premium (25€/month)</strong> — recurring monthly subscription with advanced features.</li>
                </ul>
                <p className="mt-3">Payments are processed by <strong>Paddle.com</strong>, the Merchant of Record for our service. Pro and Premium subscriptions renew automatically each month. You can cancel at any time from your account — access remains active until the end of the paid period.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Rights to generated patterns</h2>
                <p>The embroidery patterns generated from your photographs belong entirely to you. You may use them personally or commercially without restriction. PointArt.art claims no rights over user-generated content.</p>
                <p className="mt-3">Uploaded photos are not stored permanently — they are processed to generate the pattern and then deleted from our systems.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Service limitations</h2>
                <p>The service is provided &quot;as-is&quot;. We do not guarantee 100% availability or that generated patterns will be perfect for every type of photograph. We are not responsible for indirect losses resulting from the use or unavailability of the service.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Changes to terms</h2>
                <p>We reserve the right to modify these terms. Significant changes will be communicated by email at least 14 days before taking effect. Continued use of the service after that date constitutes acceptance of the new terms.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Governing law and disputes</h2>
                <p>These terms are governed by the law of the Republic of Moldova. Any dispute will be resolved in the competent courts of the Republic of Moldova.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
                <p>For any questions related to these terms, write to us at <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a>.</p>
              </section>
            </>
          ) : lang === 'ru' ? (
            <>
              <p>Используя платформу PointArt.art, вы соглашаетесь с приведёнными ниже условиями. Пожалуйста, ознакомьтесь с ними перед использованием сервиса.</p>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Описание сервиса</h2>
                <p>PointArt.art — онлайн-платформа для автоматического создания схем вышивки (крестиком, гобелен, алмазная живопись, мини-крест) на основе фотографий пользователя. Сервис управляется физическим лицом, зарегистрированным в Республике Молдова.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Условия использования</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Вам должно быть не менее 18 лет или необходимо согласие законного представителя.</li>
                  <li>Вы несёте ответственность за безопасность и конфиденциальность вашего аккаунта.</li>
                  <li>Создание нескольких аккаунтов для повторного использования бесплатного пробного периода запрещено.</li>
                  <li>Использование сервиса в незаконных целях или в нарушение авторских прав запрещено.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Тарифы и оплата</h2>
                <p>PointArt предлагает следующие планы доступа:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Пробный период</strong> — 5 дней бесплатного доступа ко всем функциям.</li>
                  <li><strong>Starter (5€)</strong> — единоразовый платёж, неограниченный доступ к базовым функциям.</li>
                  <li><strong>Pro (10€/мес)</strong> — ежемесячная подписка.</li>
                  <li><strong>Premium (25€/мес)</strong> — ежемесячная подписка с расширенными функциями.</li>
                </ul>
                <p className="mt-3">Платежи обрабатываются через <strong>Paddle.com</strong>. Подписки Pro и Premium автоматически продлеваются каждый месяц. Вы можете отменить подписку в любое время из своего аккаунта — доступ остаётся активным до конца оплаченного периода.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Права на созданные схемы</h2>
                <p>Схемы вышивки, созданные на основе ваших фотографий, принадлежат вам полностью. Вы можете использовать их в личных или коммерческих целях без ограничений. PointArt.art не претендует на какие-либо права на контент, созданный пользователями.</p>
                <p className="mt-3">Загруженные фотографии не хранятся постоянно — они обрабатываются для создания схемы и затем удаляются из наших систем.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Ограничения сервиса</h2>
                <p>Сервис предоставляется &quot;как есть&quot;. Мы не гарантируем 100% доступность или что созданные схемы будут идеальными для любого типа фотографии. Мы не несём ответственности за косвенные убытки, возникшие в результате использования или недоступности сервиса.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Изменения условий</h2>
                <p>Мы оставляем за собой право изменять эти условия. О существенных изменениях мы уведомим по электронной почте не менее чем за 14 дней до вступления в силу. Продолжение использования сервиса после этой даты означает принятие новых условий.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Применимое право и споры</h2>
                <p>Настоящие условия регулируются законодательством Республики Молдова. Любые споры разрешаются в компетентных судах Республики Молдова.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Контакт</h2>
                <p>По вопросам, связанным с настоящими условиями, пишите нам на <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a>.</p>
              </section>
            </>
          ) : (
            <>
              <p>Prin utilizarea platformei PointArt.art ești de acord cu termenii de mai jos. Te rugăm să îi citești înainte de a folosi serviciul.</p>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Descrierea serviciului</h2>
                <p>PointArt.art este o platformă online care generează automat scheme de broderie (cross-stitch, goblen, diamante, mini cros) pe baza fotografiilor încărcate de utilizator. Serviciul este operat de o persoană fizică cu sediul în Republica Moldova.</p>
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
                <p className="mt-3">Plățile sunt procesate de <strong>Paddle.com</strong>. Abonamentele Pro și Premium se reînnoiesc automat lunar. Poți anula oricând din contul tău — accesul rămâne activ până la sfârșitul perioadei plătite.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Drepturile asupra schemelor generate</h2>
                <p>Schemele de broderie generate pe baza fotografiilor tale îți aparțin integral. Le poți folosi personal sau comercial fără restricții. PointArt.art nu revendică niciun drept asupra conținutului generat de utilizatori.</p>
                <p className="mt-3">Fotografiile încărcate nu sunt stocate permanent — sunt procesate pentru generarea schemei și șterse ulterior din sistemele noastre.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Limitările serviciului</h2>
                <p>Serviciul este oferit &quot;ca atare&quot; (<em>as-is</em>). Nu garantăm disponibilitate 100% sau că schemele generate vor fi perfecte pentru orice tip de fotografie. Nu suntem responsabili pentru pierderile indirecte rezultate din utilizarea sau indisponibilitatea serviciului.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Modificări ale termenilor</h2>
                <p>Ne rezervăm dreptul de a modifica acești termeni. Modificările semnificative vor fi comunicate prin email cu cel puțin 14 zile înainte de intrarea în vigoare. Continuarea utilizării serviciului după această dată constituie acceptarea noilor termeni.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Guvernare și litigii</h2>
                <p>Acești termeni sunt guvernați de legislația Republicii Moldova. Orice litigiu va fi soluționat în instanțele competente din Republica Moldova.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2>
                <p>Pentru orice întrebări legate de acești termeni, scrie-ne la <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a>.</p>
              </section>
            </>
          )}

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

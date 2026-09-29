import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'
import { LanguageToggle } from '@/components/LanguageToggle'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'

export const metadata: Metadata = {
  title: 'Privacy Policy — PointArt',
}

export default async function PrivacyPage() {
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
            <span className="text-gray-500 text-sm">{t(lang, 'legal.privacy_title')}</span>
          </div>
          <LanguageToggle lang={lang} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t(lang, 'legal.privacy_title')}</h1>
        <p className="text-gray-400 text-sm mb-10">{t(lang, 'legal.last_updated')}: {lang === 'en' ? 'June 2026' : lang === 'ru' ? 'Июнь 2026' : 'Iunie 2026'}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          {lang === 'en' ? (
            <>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Who we are</h2>
                <p>PointArt is an online service that generates patterns for needlework (cross-stitch, tapestry, diamond painting) from photographs. The service is operated by the PointArt team, Republic of Moldova. Contact: <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a></p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. What data we collect</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Email address</strong> — at registration and login, used for account-related communications.</li>
                  <li><strong>Uploaded images</strong> — photos you upload to generate patterns. Stored securely in Supabase Storage.</li>
                  <li><strong>Generated patterns</strong> — pattern data (colors, symbols, dimensions) saved in your account.</li>
                  <li><strong>Payment data</strong> — the amount and currency of payments made (no card data; payments are made by bank transfer).</li>
                  <li><strong>Technical logs</strong> — anonymous data about errors and performance, for service maintenance.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. How we use the data</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Providing the service: generating and storing patterns, managing subscriptions.</li>
                  <li>Account communications: registration confirmation, subscription notifications.</li>
                  <li>Technical support: responding to your requests.</li>
                  <li>Service improvement: analysis of technical errors (anonymized data).</li>
                </ul>
                <p className="mt-3">We do not sell, rent, or share your data with third parties for marketing purposes.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. How long we keep data</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account data and patterns</strong> — for the duration of your account.</li>
                  <li><strong>Original images</strong> — stored until the pattern or account is deleted.</li>
                  <li><strong>Security logs</strong> — maximum 90 days.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Our service providers</h2>
                <p>We use the following third-party services to operate PointArt:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Supabase</strong> — database and authentication (EU/US).</li>
                  <li><strong>Vercel</strong> — application hosting (US).</li>
                </ul>
                <p className="mt-3">These providers have access to data strictly to the extent necessary to provide their service.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Access the data we hold about you.</li>
                  <li>Correct inaccurate data.</li>
                  <li>Request deletion of your data (right to be forgotten).</li>
                  <li>Restrict data processing in certain circumstances.</li>
                  <li>Port your data (export in structured format).</li>
                </ul>
                <p className="mt-3">To exercise these rights, contact us at <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a>. We will respond within 30 days.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Cookies</h2>
                <p>We use strictly necessary cookies:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Authentication session cookie</strong> — to maintain the authenticated state.</li>
                  <li><strong>Language preference cookie</strong> — to remember your language choice (Romanian/Russian/English).</li>
                </ul>
                <p className="mt-3">We do not use tracking or advertising cookies.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Security</h2>
                <p>We apply technical and organizational measures to protect data: encryption in transit (HTTPS), secure authentication (Supabase Auth), restricted access to sensitive data via RLS policies, monitoring of unauthorized access attempts.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Policy changes</h2>
                <p>We may update this policy periodically. Significant changes will be communicated via email or in-app announcement. Continued use of the service after notification constitutes acceptance of the changes.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact</h2>
                <p>For any questions regarding data privacy: <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a></p>
              </section>
            </>
          ) : lang === 'ru' ? (
            <>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Кто мы</h2>
                <p>PointArt — онлайн-сервис для создания схем рукоделия (вышивка крестиком, гобелен, алмазная живопись) из фотографий. Сервис работает под управлением команды PointArt, Республика Молдова. Контакт: <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a></p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Какие данные мы собираем</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Адрес электронной почты</strong> — при регистрации и авторизации, используется для уведомлений по аккаунту.</li>
                  <li><strong>Загруженные изображения</strong> — фотографии для создания схем. Хранятся в Supabase Storage.</li>
                  <li><strong>Созданные схемы</strong> — данные схемы (цвета, символы, размеры) сохраняются в вашем аккаунте.</li>
                  <li><strong>Данные об оплатах</strong> — сумма и валюта платежей (без данных карты; оплата банковским переводом).</li>
                  <li><strong>Технические журналы</strong> — анонимные данные об ошибках и производительности.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Как мы используем данные</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Предоставление сервиса: создание и хранение схем, управление подпиской.</li>
                  <li>Уведомления по аккаунту: подтверждение регистрации, уведомления о подписке.</li>
                  <li>Техническая поддержка: ответы на ваши запросы.</li>
                  <li>Улучшение сервиса: анализ технических ошибок (анонимные данные).</li>
                </ul>
                <p className="mt-3">Мы не продаём, не сдаём в аренду и не передаём ваши данные третьим лицам в маркетинговых целях.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Как долго мы храним данные</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Данные аккаунта и схемы</strong> — в течение существования вашего аккаунта.</li>
                  <li><strong>Исходные изображения</strong> — до удаления схемы или аккаунта.</li>
                  <li><strong>Журналы безопасности</strong> — не более 90 дней.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Наши поставщики услуг</h2>
                <p>Для работы PointArt мы используем:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Supabase</strong> — база данных и аутентификация (ЕС/США).</li>
                  <li><strong>Vercel</strong> — хостинг приложения (США).</li>
                </ul>
                <p className="mt-3">Эти поставщики имеют доступ к данным только в той мере, которая необходима для оказания их услуги.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Ваши права</h2>
                <p>Вы имеете право:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Получить доступ к хранимым данным о вас.</li>
                  <li>Исправить неточные данные.</li>
                  <li>Потребовать удаления ваших данных (право на забвение).</li>
                  <li>Ограничить обработку данных в определённых случаях.</li>
                  <li>Перенести ваши данные (экспорт в структурированном формате).</li>
                </ul>
                <p className="mt-3">Для реализации этих прав свяжитесь с нами по адресу <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a>. Мы ответим в течение 30 дней.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Файлы cookie</h2>
                <p>Мы используем только необходимые файлы cookie:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Cookie сессии</strong> — для поддержания авторизованного состояния.</li>
                  <li><strong>Cookie языка</strong> — для сохранения выбранного языка (румынский/русский/английский).</li>
                </ul>
                <p className="mt-3">Мы не используем файлы cookie для отслеживания или рекламы.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Безопасность</h2>
                <p>Мы применяем технические и организационные меры для защиты данных: шифрование при передаче (HTTPS), безопасная аутентификация (Supabase Auth), ограниченный доступ к чувствительным данным через политики RLS, мониторинг попыток несанкционированного доступа.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Изменения политики</h2>
                <p>Мы можем периодически обновлять эту политику. О существенных изменениях мы уведомим по электронной почте или в приложении. Продолжение использования сервиса после уведомления означает принятие изменений.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Контакт</h2>
                <p>По вопросам конфиденциальности данных: <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a></p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Cine suntem</h2>
                <p>PointArt este un serviciu online care generează scheme pentru lucrări manuale (broderie, goblene, picturi cu diamante) din fotografii. Serviciul este operat de echipa PointArt, Republica Moldova. Contact: <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a></p>
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
                  <li><strong>Supabase</strong> — bază de date și autentificare (UE/SUA).</li>
                  <li><strong>Vercel</strong> — găzduire aplicație (SUA).</li>
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
                <p className="mt-3">Pentru a exercita aceste drepturi, contactează-ne la <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a>. Vom răspunde în maximum 30 de zile.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Cookie-uri</h2>
                <p>Folosim cookie-uri strict necesare funcționării serviciului:</p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Cookie de sesiune autentificare</strong> — pentru a menține starea autentificată.</li>
                  <li><strong>Cookie preferință limbă</strong> — pentru a reține alegerea limbii (română/rusă/engleză).</li>
                </ul>
                <p className="mt-3">Nu folosim cookie-uri de tracking sau publicitate.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Securitate</h2>
                <p>Aplicăm măsuri tehnice și organizatorice pentru protecția datelor: criptare în tranzit (HTTPS), autentificare securizată (Supabase Auth), acces restricționat la datele sensibile prin politici RLS, monitorizare tentative de acces neautorizat.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Modificări ale politicii</h2>
                <p>Putem actualiza această politică periodic. Modificările semnificative vor fi comunicate prin email sau prin anunț în aplicație. Continuarea utilizării serviciului după notificare constituie acceptul modificărilor.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contact</h2>
                <p>Pentru orice întrebări privind confidențialitatea datelor: <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a></p>
              </section>
            </>
          )}

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

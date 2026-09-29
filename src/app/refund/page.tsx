import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/SiteFooter'
import { LanguageToggle } from '@/components/LanguageToggle'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'

export const metadata: Metadata = {
  title: 'Refund Policy — PointArt',
}

export default async function RefundPage() {
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
            <span className="text-gray-500 text-sm">{t(lang, 'legal.refund_title')}</span>
          </div>
          <LanguageToggle lang={lang} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t(lang, 'legal.refund_title')}</h1>
        <p className="text-gray-400 text-sm mb-10">{t(lang, 'legal.last_updated')}: {lang === 'en' ? 'September 2026 · Version 1.0' : lang === 'ru' ? 'Сентябрь 2026 · Версия 1.0' : 'Septembrie 2026 · Versiunea 1.0'}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700">

          {lang === 'en' ? (
            <>
              <p>We want you to be satisfied with PointArt. If something did not work as expected, you can request a refund according to the conditions below.</p>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Starter Plan — one-time payment (5€)</h2>
                <p>We offer a full refund within <strong>14 days</strong> of the payment date, no questions asked, if you have not downloaded more than 3 PDF patterns.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Pro and Premium Plans — monthly subscription</h2>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">First billing period</h3>
                <p>If you are unsatisfied after the first monthly payment, you can request a full refund within <strong>14 days of activation</strong>.</p>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Subsequent periods</h3>
                <p>Already paid billing periods are not refundable. When you cancel your subscription, access remains active until the end of the current paid period.</p>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Cancelling your subscription</h3>
                <p>You can cancel at any time from the <strong>My Account</strong> section. Cancellation takes effect at the end of the current period — no further charges will be made.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">When refunds are not given</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You have downloaded more than 3 PDF patterns during the period for which you are requesting the refund.</li>
                  <li>The account was suspended due to a violation of the terms and conditions.</li>
                  <li>More than 14 days have passed since the payment.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">How to request a refund</h2>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>Send an email to <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a> with the subject <strong>&quot;Refund [Starter / Pro / Premium]&quot;</strong>.</li>
                  <li>Include the email address of your account and the reason for the request (optional, but helpful for us).</li>
                  <li>We respond within <strong>2–3 business days</strong> and initiate the refund through Paddle.</li>
                  <li>The amount appears on your card within <strong>5–10 banking days</strong>, depending on your bank.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
                <p>Have a special situation? Write to us at <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a> — we review each case individually and do our best to find a fair solution.</p>
              </section>
            </>
          ) : lang === 'ru' ? (
            <>
              <p>Мы хотим, чтобы вы были довольны PointArt. Если что-то не сработало, как ожидалось, вы можете запросить возврат средств в соответствии с условиями ниже.</p>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Тариф Starter — единоразовый платёж (5€)</h2>
                <p>Мы предлагаем полный возврат средств в течение <strong>14 дней</strong> с даты оплаты, без вопросов, если вы не загружали более 3 PDF-схем.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Тарифы Pro и Premium — ежемесячная подписка</h2>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Первый расчётный период</h3>
                <p>Если вы недовольны после первого ежемесячного платежа, вы можете запросить полный возврат в течение <strong>14 дней с момента активации</strong>.</p>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Последующие периоды</h3>
                <p>Уже оплаченные расчётные периоды возврату не подлежат. При отмене подписки доступ остаётся активным до конца текущего оплаченного периода.</p>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Отмена подписки</h3>
                <p>Вы можете отменить подписку в любое время в разделе <strong>Мой кабинет</strong>. Отмена вступает в силу в конце текущего периода — никаких дальнейших списаний не будет.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Когда возврат не предоставляется</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Вы загрузили более 3 PDF-схем за период, за который запрашиваете возврат.</li>
                  <li>Аккаунт был заблокирован из-за нарушения условий использования.</li>
                  <li>Прошло более 14 дней с момента оплаты.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Как запросить возврат</h2>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>Отправьте письмо на <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a> с темой <strong>&quot;Возврат [Starter / Pro / Premium]&quot;</strong>.</li>
                  <li>Укажите адрес электронной почты вашего аккаунта и причину обращения (необязательно, но полезно для нас).</li>
                  <li>Мы ответим в течение <strong>2–3 рабочих дней</strong> и инициируем возврат через Paddle.</li>
                  <li>Сумма поступит на вашу карту в течение <strong>5–10 банковских дней</strong>, в зависимости от банка.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Контакт</h2>
                <p>У вас особая ситуация? Напишите нам на <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a> — мы рассматриваем каждый случай индивидуально и делаем всё возможное для справедливого решения.</p>
              </section>
            </>
          ) : (
            <>
              <p>Ne dorim să fii mulțumit de PointArt. Dacă ceva nu a funcționat cum te așteptai, poți solicita o rambursare conform condițiilor de mai jos.</p>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Plan Starter — plată unică (5€)</h2>
                <p>Oferim rambursare completă în <strong>14 zile</strong> de la data plății, fără întrebări suplimentare, dacă nu ai descărcat mai mult de 3 scheme PDF.</p>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Planuri Pro și Premium — abonament lunar</h2>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Prima perioadă de facturare</h3>
                <p>Dacă ești nemulțumit după prima plată lunară, poți solicita rambursare completă în <strong>14 zile de la activare</strong>.</p>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Perioadele următoare</h3>
                <p>Perioadele de facturare deja plătite nu se rambursează. La anularea abonamentului, accesul rămâne activ până la sfârșitul perioadei curente plătite.</p>
                <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2">Anularea abonamentului</h3>
                <p>Poți anula oricând din secțiunea <strong>Contul meu</strong>. Anularea intră în vigoare la finalul perioadei curente — nu se mai percepe nicio sumă ulterioară.</p>
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
                  <li>Trimite un email la <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a> cu subiectul <strong>&quot;Rambursare [Starter / Pro / Premium]&quot;</strong>.</li>
                  <li>Include adresa de email a contului tău și motivul solicitării (opțional, dar util pentru noi).</li>
                  <li>Răspundem în <strong>2–3 zile lucrătoare</strong> și inițiem rambursarea prin Paddle.</li>
                  <li>Suma apare pe cardul tău în <strong>5–10 zile bancare</strong>, în funcție de bancă.</li>
                </ol>
              </section>
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">Contact</h2>
                <p>Ai o situație specială? Scrie-ne la <a href="mailto:contact@pointart.md" className="text-violet-600 hover:underline">contact@pointart.md</a> — analizăm fiecare caz individual și facem tot posibilul să găsim o soluție corectă.</p>
              </section>
            </>
          )}

        </div>
      </main>

      <SiteFooter />
    </div>
  )
}

import Link from 'next/link'
import { getLang } from '@/lib/i18n/getLang'
import { t } from '@/lib/i18n/translations'

export async function SiteFooter() {
  const lang = await getLang()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-100 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span>🧵</span>
          <span className="font-semibold text-gray-700">PointArt</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-violet-600 transition-colors">
            {t(lang, 'footer.privacy')}
          </Link>
          <span className="hidden sm:inline">·</span>
          <p>{t(lang, 'footer.rights').replace('{year}', String(year))}</p>
        </div>
      </div>
    </footer>
  )
}

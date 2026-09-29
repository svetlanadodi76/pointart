'use client'
import { useTransition } from 'react'
import { deleteSchemaAction } from './actions'
import { t, type Lang } from '@/lib/i18n/translations'

interface Props {
  schemaId: string
  currentPageId: string
  redirectAfterDelete?: string
  lang?: Lang
}

export function DeleteSchemaButton({ schemaId, currentPageId, redirectAfterDelete, lang = 'ro' }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm(t(lang, 'schema.delete_confirm'))) return
    startTransition(() => {
      deleteSchemaAction(schemaId, currentPageId, redirectAfterDelete)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title={t(lang, 'schema.delete_title')}
      className="ml-1.5 text-amber-500 hover:text-red-600 transition-colors disabled:opacity-40 leading-none"
    >
      {isPending ? '…' : '✕'}
    </button>
  )
}

'use client'
import { useTransition } from 'react'
import { deleteSchemaAction } from './actions'

interface Props {
  schemaId: string
  currentPageId: string
  redirectAfterDelete?: string
}

export function DeleteSchemaButton({ schemaId, currentPageId, redirectAfterDelete }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    if (!confirm('Sigur vrei să ștergi această schemă? Acțiunea nu poate fi anulată.')) return
    startTransition(() => {
      deleteSchemaAction(schemaId, currentPageId, redirectAfterDelete)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Șterge schema"
      className="ml-1.5 text-amber-500 hover:text-red-600 transition-colors disabled:opacity-40 leading-none"
    >
      {isPending ? '…' : '✕'}
    </button>
  )
}

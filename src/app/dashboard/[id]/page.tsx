import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { SchemaViewer } from './SchemaViewer'
import type { GeneratedSchema } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SchemaDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const [{ data: schema }, { data: subscription }] = await Promise.all([
    supabase.from('schemas').select('*').eq('id', id).eq('user_id', user.id).single(),
    supabase.from('subscriptions').select('plan, status').eq('user_id', user.id).single(),
  ])

  if (!schema) notFound()

  const canDownloadPdf = subscription?.status === 'active' && subscription?.plan !== 'free_trial'
  const schemaData = schema.schema_data as GeneratedSchema

  const craftLabel =
    schema.craft_type === 'cross_stitch' ? 'Broderie'
    : schema.craft_type === 'goblene' ? 'Goblene'
    : 'Diamante'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1.5 text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Dashboard
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="font-semibold text-gray-900 truncate">{schema.name}</h1>
          <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full whitespace-nowrap ml-auto">
            {craftLabel}
          </span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Info bandă */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span>📐 {schema.width_stitches}×{schema.height_stitches} puncte</span>
          <span>📏 {schema.width_cm}×{schema.height_cm} cm</span>
          {schema.canvas_type && <span>🧵 Canvas {schema.canvas_type}</span>}
          <span>🎨 {schema.colors_used} culori DMC</span>
          {schema.folder && (
            <span className="flex items-center gap-1 text-violet-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              </svg>
              {schema.folder}
            </span>
          )}
          <span className="text-gray-400 ml-auto">
            {new Date(schema.created_at).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Vizualizare */}
        <SchemaViewer
          schema={schemaData}
          name={schema.name}
          canDownloadPdf={canDownloadPdf}
          craftType={schema.craft_type}
          canvasType={schema.canvas_type}
        />
      </div>
    </div>
  )
}

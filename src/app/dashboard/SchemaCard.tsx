'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { deleteSchema, updateSchemaFolder } from './actions'

interface Schema {
  id: string
  name: string
  craft_type: string
  canvas_type: string | null
  width_stitches: number
  height_stitches: number
  colors_used: number
  created_at: string
  folder: string | null
}

interface VariantRef {
  id: string
  colors_used: number
}

interface SchemaCardProps {
  schema: Schema
  existingFolders: string[]
  variants?: VariantRef[]
  imageUrl?: string
}

export function SchemaCard({ schema, existingFolders, variants = [], imageUrl }: SchemaCardProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showFolderInput, setShowFolderInput] = useState(false)
  const [folderValue, setFolderValue] = useState(schema.folder ?? '')
  // currentFolder e actualizat optimist imediat după salvare, fără să aștepte re-render server
  const [currentFolder, setCurrentFolder] = useState<string | null>(schema.folder)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus programatic după ce inputul apare — evită conflicte cu autoFocus
  useEffect(() => {
    if (showFolderInput) {
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [showFolderInput])

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(() => deleteSchema(schema.id))
  }

  const handleFolderSave = () => {
    const newFolder = folderValue.trim() || null
    setCurrentFolder(newFolder) // actualizare imediată în UI
    startTransition(() => updateSchemaFolder(schema.id, newFolder))
    setShowFolderInput(false)
  }

  const handleFolderCancel = () => {
    setFolderValue(currentFolder ?? '')
    setShowFolderInput(false)
  }

  const craftLabel =
    schema.craft_type === 'cross_stitch' ? 'Broderie'
    : schema.craft_type === 'goblene' ? 'Goblene'
    : 'Diamante'

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 transition-opacity ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header: nume + badge + ștergere */}
      <div className="flex items-start gap-2 mb-3">
        <Link
          href={`/dashboard/${schema.id}`}
          className="font-semibold text-gray-900 hover:text-violet-700 transition-colors flex-1 min-w-0 truncate"
        >
          {schema.name}
        </Link>
        <span className="text-xs bg-violet-50 text-violet-700 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
          {craftLabel}
        </span>
        {confirmDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setConfirmDelete(false)}
              className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1"
            >
              Nu
            </button>
            <button
              onClick={handleDelete}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors"
            >
              Da, șterge
            </button>
          </div>
        ) : (
          <button
            onClick={handleDelete}
            title="Șterge schema"
            className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-0.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Stats + thumbnail */}
      <div className="flex items-start gap-3">
        <div className="text-sm text-gray-500 space-y-1 flex-1">
          <p>📐 {schema.width_stitches}×{schema.height_stitches} puncte</p>
          <p>🎨 {schema.colors_used} culori DMC</p>
          {schema.canvas_type && <p>🧵 Canvas {schema.canvas_type}</p>}
        </div>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            width={64}
            height={64}
            className="w-16 h-16 object-cover rounded-lg shrink-0 border border-gray-100"
          />
        )}
      </div>

      {/* Buton deschide */}
      <Link
        href={`/dashboard/${schema.id}`}
        className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-violet-700 font-medium bg-violet-50 hover:bg-violet-100 transition-colors rounded-lg py-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
        {schema.colors_used} culori — Vizualizează
      </Link>

      {/* Variante din aceeași poză */}
      {variants.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-xs text-gray-400 self-center">Variante:</span>
          {variants.map(v => (
            <Link
              key={v.id}
              href={`/dashboard/${v.id}`}
              className="text-xs bg-amber-50 text-amber-700 hover:bg-amber-100 px-2 py-1 rounded-full transition-colors"
            >
              {v.colors_used} culori
            </Link>
          ))}
        </div>
      )}

      {/* Footer: dată + folder */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">
          {new Date(schema.created_at).toLocaleDateString('ro-RO')}
        </p>

        {showFolderInput ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={folderValue}
              onChange={e => setFolderValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleFolderSave()
                if (e.key === 'Escape') handleFolderCancel()
              }}
              placeholder="Nume folder..."
              className="text-xs text-gray-900 border border-violet-300 rounded px-2 py-1 w-32 focus:outline-none focus:border-violet-500 bg-white"
              list={`folders-${schema.id}`}
            />
            {existingFolders.length > 0 && (
              <datalist id={`folders-${schema.id}`}>
                {existingFolders.map(f => <option key={f} value={f} />)}
              </datalist>
            )}
            <button
              onClick={handleFolderSave}
              className="text-xs text-violet-600 hover:text-violet-800 font-bold px-1"
              title="Salvează"
            >
              ✓
            </button>
            <button
              onClick={handleFolderCancel}
              className="text-xs text-gray-400 hover:text-gray-600 px-1"
              title="Anulează"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setFolderValue(currentFolder ?? ''); setShowFolderInput(true) }}
            className={`text-xs flex items-center gap-1 transition-colors ${
              currentFolder
                ? 'text-violet-600 hover:text-violet-800 font-medium'
                : 'text-gray-400 hover:text-violet-500'
            }`}
            title={currentFolder ? `Folder: ${currentFolder} — click pentru a schimba` : 'Atribuie la un folder'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
            <span className="truncate max-w-[100px]">{currentFolder ?? 'Folder...'}</span>
          </button>
        )}
      </div>
    </div>
  )
}

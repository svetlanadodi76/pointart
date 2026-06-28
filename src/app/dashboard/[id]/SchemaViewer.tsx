'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { SchemaPDF } from '@/lib/pdf/SchemaPDF'
import { FabricPDF } from '@/lib/pdf/FabricPDF'
import type { GeneratedSchema, CraftType, CanvasType } from '@/types'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => m.PDFDownloadLink),
  { ssr: false }
)

interface Props {
  schema: GeneratedSchema
  name: string
  canDownloadPdf: boolean
  craftType: CraftType
  canvasType: CanvasType | null
}

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.9)'
}

export function SchemaViewer({ schema, name, canDownloadPdf, craftType, canvasType }: Props) {
  const [view, setView] = useState<'schema' | 'final'>('schema')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const CELL_SIZE = Math.max(4, Math.min(12, Math.floor(700 / schema.widthStitches)))

  useEffect(() => {
    if (view !== 'final' || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = Math.max(2, Math.floor(700 / schema.widthStitches))
    canvas.width = schema.widthStitches * scale
    canvas.height = schema.heightStitches * scale
    for (let y = 0; y < schema.heightStitches; y++) {
      for (let x = 0; x < schema.widthStitches; x++) {
        const colorIdx = schema.grid[y][x]
        ctx.fillStyle = schema.colors[colorIdx].dmcColor.hex
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }, [view, schema])

  return (
    <div className="space-y-6">
      {/* Toggle + PDF */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView('schema')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'schema' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📐 Schema (cu simboluri)
          </button>
          <button
            onClick={() => setView('final')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === 'final' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🖼️ Final (culori)
          </button>
        </div>

        {canDownloadPdf ? (
          <div className="flex flex-wrap gap-2">
            <PDFDownloadLink
              document={<SchemaPDF schema={schema} name={name} />}
              fileName={`${name.replace(/\s+/g, '-')}.pdf`}
            >
              {({ loading: pdfLoading }: { loading: boolean }) => (
                <button
                  disabled={pdfLoading}
                  className="bg-green-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors disabled:opacity-60 text-sm"
                >
                  {pdfLoading ? '⏳ Pregătesc...' : '📄 PDF schemă'}
                </button>
              )}
            </PDFDownloadLink>
            <PDFDownloadLink
              document={<FabricPDF schema={schema} name={name} craftType={craftType} canvasType={canvasType ?? '14CT'} />}
              fileName={`${name.replace(/\s+/g, '-')}-pinza.pdf`}
            >
              {({ loading: pdfLoading }: { loading: boolean }) => (
                <button
                  disabled={pdfLoading}
                  className="bg-violet-700 text-white px-5 py-2 rounded-xl font-medium hover:bg-violet-800 transition-colors disabled:opacity-60 text-sm"
                >
                  {pdfLoading ? '⏳ Pregătesc...' : '🖨️ Tipărire pânză (1:1)'}
                </button>
              )}
            </PDFDownloadLink>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-700 text-sm">
            📄 PDF disponibil doar pe plan plătit
          </div>
        )}
      </div>

      {/* Schema cu simboluri + riglă */}
      {view === 'schema' && (
        <div className="overflow-auto border border-gray-200 rounded-xl bg-white">
          <div style={{ display: 'inline-block', minWidth: 'max-content', padding: 8 }}>
            {/* Riglă sus */}
            <div style={{ display: 'flex', paddingLeft: 28 }}>
              {Array.from({ length: Math.floor(schema.widthStitches / 10) + 1 }, (_, i) => {
                const col = i * 10
                if (col >= schema.widthStitches) return null
                return (
                  <div
                    key={col}
                    style={{
                      width: Math.min(10, schema.widthStitches - col) * CELL_SIZE,
                      fontSize: 9, color: '#9ca3af', userSelect: 'none',
                      paddingLeft: 1, lineHeight: '14px', flexShrink: 0,
                    }}
                  >
                    {col === 0 ? '' : col}
                  </div>
                )
              })}
            </div>

            {/* Riglă stânga + grilă */}
            <div style={{ display: 'flex' }}>
              <div style={{ width: 28, position: 'relative', flexShrink: 0 }}>
                {Array.from({ length: Math.floor(schema.heightStitches / 10) + 1 }, (_, i) => {
                  const row = i * 10
                  if (row >= schema.heightStitches) return null
                  return (
                    <div
                      key={row}
                      style={{
                        position: 'absolute', top: row * CELL_SIZE,
                        right: 2, left: 0,
                        fontSize: 9, color: '#9ca3af',
                        textAlign: 'right', lineHeight: 1,
                        userSelect: 'none', paddingTop: 1,
                      }}
                    >
                      {row === 0 ? '' : row}
                    </div>
                  )
                })}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${schema.widthStitches}, ${CELL_SIZE}px)` }}>
                {schema.grid.map((row, y) =>
                  row.map((colorIdx, x) => {
                    const color = schema.colors[colorIdx]
                    const isRuler = x % 10 === 0 || y % 10 === 0
                    return (
                      <div
                        key={`${y}-${x}`}
                        title={`(${x},${y}) ${color.dmcColor.code} ${color.symbol}`}
                        style={{
                          width: CELL_SIZE, height: CELL_SIZE,
                          backgroundColor: color.dmcColor.hex,
                          border: isRuler ? '0.5px solid rgba(0,0,0,0.3)' : '0.5px solid rgba(0,0,0,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: CELL_SIZE > 8 ? CELL_SIZE * 0.6 : 0,
                          color: contrastColor(color.dmcColor.hex), lineHeight: 1,
                        }}
                      >
                        {CELL_SIZE > 8 ? color.symbol : ''}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview final canvas */}
      {view === 'final' && (
        <div className="overflow-auto border border-gray-200 rounded-xl bg-white p-2">
          <canvas
            ref={canvasRef}
            style={{ display: 'block', imageRendering: 'pixelated', maxWidth: '100%' }}
          />
          <p className="text-xs text-gray-400 text-center py-2">
            Cum va arăta lucrarea terminată cu culorile DMC selectate
          </p>
        </div>
      )}

      {/* Legendă culori */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Culori folosite ({schema.colors.length})
        </h3>
        {/* Header tabel */}
        <div className="grid grid-cols-[28px_28px_1fr_auto] gap-x-3 pb-1.5 mb-1 border-b border-gray-200">
          <span className="text-[10px] font-semibold text-gray-400 text-center">#</span>
          <span className="text-[10px] font-semibold text-gray-400 text-center">Simbol</span>
          <span className="text-[10px] font-semibold text-gray-400">Culoare DMC</span>
          <span className="text-[10px] font-semibold text-gray-400 text-right">Cantitate</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {[...schema.colors]
            .sort((a, b) => b.count - a.count)
            .map((color, i) => (
              <div key={i} className="grid grid-cols-[28px_28px_1fr_auto] items-center gap-x-3 py-1.5 border-b border-gray-50">
                {/* Număr ordine */}
                <span className="text-xs font-bold text-gray-400 text-center">{i + 1}</span>

                {/* Simbol pe fundal colorat */}
                <div
                  className="w-7 h-7 rounded border border-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: color.dmcColor.hex, color: 'rgba(0,0,0,0.6)' }}
                >
                  {color.symbol}
                </div>

                {/* DMC cod + nume */}
                <div className="min-w-0">
                  <p className="text-xs font-mono font-semibold text-gray-700">DMC {color.dmcColor.code}</p>
                  <p className="text-xs text-gray-400 truncate">{color.dmcColor.name}</p>
                </div>

                {/* Cantitate */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-gray-700">
                    {color.skeins} {color.unit === 'packets' ? 'pach.' : 'scule'}
                  </p>
                  <p className="text-xs text-gray-400">{color.count} pct.</p>
                </div>
              </div>
            ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
          Total: {schema.widthStitches * schema.heightStitches} puncte • {schema.colors.length} culori DMC
        </p>
      </div>
    </div>
  )
}

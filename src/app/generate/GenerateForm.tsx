'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import type { GeneratedSchema } from '@/types'

const SIZE_PRESETS = [
  { label: '20×15 cm (mic)', width: 20, height: 15 },
  { label: '30×25 cm (mediu)', width: 30, height: 25 },
  { label: '40×30 cm (mare)', width: 40, height: 30 },
  { label: '50×40 cm (foarte mare)', width: 50, height: 40 },
]

export default function GenerateForm({ subscription }: { subscription: any }) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [craftType, setCraftType] = useState('cross_stitch')
  const [canvasType, setCanvasType] = useState('14CT')
  const [widthCm, setWidthCm] = useState(30)
  const [heightCm, setHeightCm] = useState(25)
  const [maxColors, setMaxColors] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedSchema | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settingsChanged, setSettingsChanged] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const canGenerate = subscription?.status === 'active' &&
    (subscription?.plan !== 'free_trial' || subscription?.schemas_remaining > 0)

  function handleImage(file: File) {
    setImage(file)
    setResult(null)
    setError(null)
    setSettingsChanged(false)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  function handlePreset(w: number, h: number) {
    setWidthCm(w)
    setHeightCm(h)
    if (result) setSettingsChanged(true)
  }

  function changeSetting(fn: () => void) {
    fn()
    if (result) setSettingsChanged(true)
  }

  async function handleGenerate() {
    if (!image || !canGenerate) return
    setLoading(true)
    setError(null)

    const fd = new FormData()
    fd.append('image', image)
    fd.append('craftType', craftType)
    fd.append('canvasType', canvasType)
    fd.append('widthCm', widthCm.toString())
    fd.append('heightCm', heightCm.toString())
    fd.append('maxColors', maxColors.toString())

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Eroare necunoscută')
      setResult(data.schema)
      setSettingsChanged(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const threads = canvasType === '11CT' ? 3 : 2

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧵</span>
              <span className="font-bold text-violet-700">PointArt</span>
            </div>
          </div>
          <span className="text-gray-500 text-sm">Schemă nouă</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Coloana stânga — setări */}
          <div className="space-y-6">

            {/* Upload imagine */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">1. Încarcă fotografia</h2>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                ) : (
                  <div>
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-gray-600 font-medium">Click pentru a încărca</p>
                    <p className="text-gray-400 text-sm mt-1">JPG, PNG, WebP — max 10MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleImage(e.target.files[0])}
              />
              {preview && (
                <button onClick={() => fileRef.current?.click()} className="text-violet-600 text-sm mt-2 hover:underline">
                  Schimbă fotografia
                </button>
              )}
            </div>

            {/* Tip lucrare */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">2. Tip de lucrare</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'cross_stitch', label: 'Broderie', icon: '✂️' },
                  { value: 'goblene', label: 'Goblene', icon: '🎨' },
                  { value: 'diamond', label: 'Diamante', icon: '💎' },
                ].map(t => (
                  <button
                    key={t.value}
                    onClick={() => changeSetting(() => setCraftType(t.value))}
                    className={`p-3 rounded-xl border-2 text-center transition-colors ${
                      craftType === t.value
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="text-sm font-medium text-gray-700">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas & dimensiuni */}
            {craftType !== 'diamond' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">3. Canvas</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(['11CT', '14CT'] as const).map(ct => (
                    <button
                      key={ct}
                      onClick={() => changeSetting(() => setCanvasType(ct))}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        canvasType === ct ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{ct}</div>
                      <div className="text-xs text-gray-500">{ct === '11CT' ? '3 fire ață' : '2 fire ață'}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  {canvasType === '11CT' ? '4.3 puncte/cm — lucrare mai relaxată' : '5.5 puncte/cm — detalii mai fine'}
                </p>
              </div>
            )}

            {/* Dimensiune */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">4. Dimensiunea lucrării</h2>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SIZE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p.width, p.height)}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      widthCm === p.width && heightCm === p.height
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-600 hover:border-violet-300'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Lățime (cm)</label>
                  <input type="number" value={widthCm} min={5} max={200}
                    onChange={e => changeSetting(() => setWidthCm(Number(e.target.value)))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Înălțime (cm)</label>
                  <input type="number" value={heightCm} min={5} max={200}
                    onChange={e => changeSetting(() => setHeightCm(Number(e.target.value)))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                → {Math.round(widthCm * (canvasType === '11CT' ? 4.3 : 5.5))} ×{' '}
                {Math.round(heightCm * (canvasType === '11CT' ? 4.3 : 5.5))} puncte
              </p>
            </div>

            {/* Culori */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-1">5. Număr culori DMC</h2>
              <p className="text-xs text-gray-400 mb-4">Mai puține = mai simplu de brodat</p>
              <div className="flex items-center gap-4">
                <input type="range" min={5} max={100} value={maxColors}
                  onChange={e => changeSetting(() => setMaxColors(Number(e.target.value)))}
                  className="flex-1 accent-violet-600"
                />
                <span className="text-violet-700 font-bold w-8 text-center">{maxColors}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 (simplu)</span><span>50 (detaliat)</span><span>100 (fotografic)</span>
              </div>
            </div>

            {/* Buton generare */}
            {settingsChanged && result && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <span>⚠️</span>
                <span>Setările s-au schimbat — apasă <strong>Generează</strong> pentru a actualiza schema</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!image || loading || !canGenerate}
              className="w-full bg-violet-700 text-white py-4 rounded-xl font-semibold text-lg hover:bg-violet-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Generez schema...' : settingsChanged ? '🔄 Regenerează schema' : '✨ Generează schema'}
            </button>

            {!canGenerate && (
              <p className="text-center text-sm text-red-500">
                Ai depășit limita planului. <Link href="/pricing" className="underline">Upgrade</Link>
              </p>
            )}
          </div>

          {/* Coloana dreapta — preview rezultat */}
          <div>
            {result ? (
              <SchemaPreview schema={result} />
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center h-full flex flex-col items-center justify-center">
                <div className="text-5xl mb-4">🖼️</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Schema ta apare aici</h3>
                <p className="text-gray-400 text-sm">Încarcă o fotografie și apasă Generează</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SchemaPreview({ schema }: { schema: GeneratedSchema }) {
  const CELL_SIZE = Math.max(4, Math.min(12, Math.floor(600 / schema.widthStitches)))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Schema generată</h2>
        <span className="text-sm text-gray-500">
          {schema.widthStitches}×{schema.heightStitches} puncte
        </span>
      </div>

      {/* Grila */}
      <div className="overflow-auto border border-gray-200 rounded-lg">
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${schema.widthStitches}, ${CELL_SIZE}px)` }}>
          {schema.grid.map((row, y) =>
            row.map((colorIdx, x) => {
              const color = schema.colors[colorIdx]
              const isRuler10x = x % 10 === 0 || y % 10 === 0
              return (
                <div
                  key={`${y}-${x}`}
                  title={`${color.dmcColor.code} ${color.symbol}`}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: color.dmcColor.hex,
                    border: isRuler10x ? '0.5px solid rgba(0,0,0,0.3)' : '0.5px solid rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: CELL_SIZE > 8 ? CELL_SIZE * 0.6 : 0,
                    color: 'rgba(0,0,0,0.5)',
                    lineHeight: 1,
                  }}
                >
                  {CELL_SIZE > 8 ? color.symbol : ''}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Legendă culori */}
      <div>
        <h3 className="font-medium text-gray-800 mb-3">Culori folosite ({schema.colors.length})</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {schema.colors
            .sort((a, b) => b.count - a.count)
            .map((color, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  className="w-6 h-6 rounded border border-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: color.dmcColor.hex, color: 'rgba(0,0,0,0.6)' }}
                >
                  {color.symbol}
                </div>
                <span className="font-mono text-gray-700 w-12">DMC {color.dmcColor.code}</span>
                <span className="text-gray-500 flex-1">{color.dmcColor.name}</span>
                <span className="text-gray-400 text-xs">
                  {color.skeins} {color.unit === 'packets' ? 'pachete' : 'seturi'}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 border-t pt-3">
        Dimensiune: {schema.widthCm}×{schema.heightCm} cm •{' '}
        {schema.widthStitches * schema.heightStitches} puncte total
      </div>
    </div>
  )
}

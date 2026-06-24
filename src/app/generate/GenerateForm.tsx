'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { GeneratedSchema } from '@/types'
import { SchemaPDF } from '@/lib/pdf/SchemaPDF'
import { FabricPDF } from '@/lib/pdf/FabricPDF'
import { LanguageToggle } from '@/components/LanguageToggle'
import { t } from '@/lib/i18n/translations'
import type { Lang } from '@/lib/i18n/translations'

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => m.PDFDownloadLink),
  { ssr: false }
)

const SIZE_PRESETS = [
  { label: '20×15 cm (mic)', width: 20, height: 15 },
  { label: '30×25 cm (mediu)', width: 30, height: 25 },
  { label: '40×30 cm (mare)', width: 40, height: 30 },
  { label: '50×40 cm (foarte mare)', width: 50, height: 40 },
]

export default function GenerateForm({ subscription, lang = 'ro' }: { subscription: any; lang?: Lang }) {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [craftType, setCraftType] = useState('cross_stitch')
  const [canvasType, setCanvasType] = useState('14CT')
  const [widthCm, setWidthCm] = useState(30)
  const [heightCm, setHeightCm] = useState(25)
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [maxColors, setMaxColors] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedSchema | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settingsChanged, setSettingsChanged] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Resetează canvasType la valoarea implicită când se schimbă tipul lucrării
  useEffect(() => {
    if (craftType === 'diamond') {
      setCanvasType('2.5mm')
    } else if (['2.5mm', '2.8mm', '3.0mm'].includes(canvasType)) {
      setCanvasType('14CT')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [craftType])

  const canGenerate = subscription?.status === 'active' &&
    (subscription?.plan !== 'free_trial' || subscription?.schemas_remaining > 0)

  function handleImage(file: File) {
    setImage(file)
    setResult(null)
    setError(null)
    setSettingsChanged(false)
    if (fileRef.current) fileRef.current.value = ''

    const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
      || file.type === 'image/heic' || file.type === 'image/heif'

    if (isHeic) {
      // Browserul nu poate reda HEIC — arătăm placeholder, Sharp procesează pe server
      setPreview('__heic__')
    } else {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handlePreset(w: number, h: number) {
    const [fw, fh] = orientation === 'portrait' ? [Math.min(w, h), Math.max(w, h)] : [Math.max(w, h), Math.min(w, h)]
    setWidthCm(fw)
    setHeightCm(fh)
    if (result) setSettingsChanged(true)
  }

  function handleOrientation(o: 'landscape' | 'portrait') {
    if (o === orientation) return
    setOrientation(o)
    setWidthCm(heightCm)
    setHeightCm(widthCm)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧵</span>
              <span className="font-bold text-violet-700">PointArt</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} />
            <span className="text-gray-500 text-sm hidden sm:block">{t(lang, 'generate.title')}</span>
          </div>
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
                {preview === '__heic__' ? (
                  <div>
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-gray-700 font-medium">{image?.name}</p>
                    <p className="text-amber-600 text-xs mt-1">Format iPhone HEIC — previzualizarea nu e disponibilă în browser, dar generarea funcționează</p>
                  </div>
                ) : preview ? (
                  <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                ) : (
                  <div>
                    <div className="text-4xl mb-3">📷</div>
                    <p className="text-gray-600 font-medium">Click pentru a încărca</p>
                    <p className="text-gray-400 text-sm mt-1">JPG, PNG, WebP, HEIC — max 10MB</p>
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

            {/* Canvas (broderie/goblene) */}
            {craftType !== 'diamond' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">3. Canvas</h2>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { ct: '11CT', strands: '3 fire', desc: '4.3 pt/cm — relaxat' },
                    { ct: '14CT', strands: '2 fire', desc: '5.5 pt/cm — standard' },
                    { ct: '16CT', strands: '2 fire', desc: '6.3 pt/cm — fin' },
                    { ct: '18CT', strands: '1 fir',  desc: '7.1 pt/cm — foarte fin' },
                  ] as const).map(({ ct, strands, desc }) => (
                    <button
                      key={ct}
                      onClick={() => changeSetting(() => setCanvasType(ct))}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        canvasType === ct ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{ct}</div>
                      <div className="text-xs text-violet-600">{strands}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mărime diamante */}
            {craftType === 'diamond' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-1">3. Mărimea diamantelor</h2>
                <p className="text-xs text-gray-400 mb-4">
                  Dimensiunea unui diamant determină rezoluția schemei
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { size: '2.5mm', label: '2.5 mm', desc: 'Standard', density: '40/10cm', popular: true },
                    { size: '2.8mm', label: '2.8 mm', desc: 'Mediu',    density: '36/10cm', popular: false },
                    { size: '3.0mm', label: '3.0 mm', desc: 'Relaxat',  density: '33/10cm', popular: false },
                  ] as const).map(({ size, label, desc, density, popular }) => (
                    <button
                      key={size}
                      onClick={() => changeSetting(() => setCanvasType(size))}
                      className={`p-3 rounded-xl border-2 text-center transition-colors relative ${
                        canvasType === size ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      {popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          popular
                        </span>
                      )}
                      <div className="font-bold text-gray-900 text-lg">💎</div>
                      <div className="font-bold text-gray-900 text-sm">{label}</div>
                      <div className="text-xs text-violet-600">{desc}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{density}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dimensiune */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-semibold text-gray-900">4. Dimensiunea lucrării</h2>
                <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                  <button
                    onClick={() => handleOrientation('landscape')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      orientation === 'landscape' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Orizontal (lățime > înălțime)"
                  >
                    <span className="inline-block w-5 h-3.5 border-2 border-current rounded-sm" />
                    Orizontal
                  </button>
                  <button
                    onClick={() => handleOrientation('portrait')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      orientation === 'portrait' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vertical (înălțime > lățime)"
                  >
                    <span className="inline-block w-3.5 h-5 border-2 border-current rounded-sm" />
                    Vertical
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {SIZE_PRESETS.map(p => {
                  const [pw, ph] = orientation === 'portrait'
                    ? [Math.min(p.width, p.height), Math.max(p.width, p.height)]
                    : [p.width, p.height]
                  const isActive = widthCm === pw && heightCm === ph
                  return (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p.width, p.height)}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      isActive
                        ? 'border-violet-500 bg-violet-50 text-violet-700'
                        : 'border-gray-200 text-gray-600 hover:border-violet-300'
                    }`}
                  >
                    {p.label}
                  </button>
                  )
                })}
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
                {(() => {
                  const spc: Record<string, number> = {
                    '11CT': 4.3, '14CT': 5.5, '16CT': 6.3, '18CT': 7.1,
                    '2.5mm': 4.0, '2.8mm': 3.571, '3.0mm': 3.333,
                  }
                  const density = spc[canvasType] ?? 5.5
                  const unit = craftType === 'diamond' ? 'diamante' : 'puncte'
                  return `→ ${Math.round(widthCm * density)} × ${Math.round(heightCm * density)} ${unit}`
                })()}
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
          <div className="space-y-4">
            {result && subscription?.plan !== 'free_trial' && (
              <div className="flex flex-col gap-2">
                <PDFDownloadLink
                  document={<SchemaPDF schema={result} name="Schema PointArt" />}
                  fileName="pointart-schema.pdf"
                >
                  {({ loading: pdfLoading }: { loading: boolean }) => (
                    <button
                      disabled={pdfLoading}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {pdfLoading ? '⏳ Pregătesc...' : '📄 Descarcă PDF schemă'}
                    </button>
                  )}
                </PDFDownloadLink>
                <PDFDownloadLink
                  document={<FabricPDF schema={result} name="Schema PointArt" craftType={craftType as any} canvasType={canvasType as any} />}
                  fileName="pointart-tiparire-pinza.pdf"
                >
                  {({ loading: pdfLoading }: { loading: boolean }) => (
                    <button
                      disabled={pdfLoading}
                      className="w-full bg-violet-700 text-white py-3 rounded-xl font-semibold hover:bg-violet-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {pdfLoading ? '⏳ Pregătesc...' : '🖨️ Tipărire pe pânză (1:1)'}
                    </button>
                  )}
                </PDFDownloadLink>
              </div>
            )}
            {result && subscription?.plan === 'free_trial' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-amber-700 text-sm font-medium">📄 Descărcarea PDF necesită un plan plătit</p>
                <Link href="/pricing" className="text-violet-700 text-sm font-medium hover:underline mt-1 block">
                  Vezi planurile →
                </Link>
              </div>
            )}
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
  const [view, setView] = useState<'schema' | 'final'>('schema')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const CELL_SIZE = Math.max(4, Math.min(12, Math.floor(600 / schema.widthStitches)))

  // Randează preview final pe canvas când se schimbă view-ul
  useEffect(() => {
    if (view !== 'final' || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scale = Math.max(2, Math.floor(600 / schema.widthStitches))
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
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
      {/* Header cu toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-semibold text-gray-900">Previzualizare</h2>
          <p className="text-xs text-gray-400">{schema.widthStitches}×{schema.heightStitches} puncte • {schema.widthCm}×{schema.heightCm} cm</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView('schema')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'schema' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📐 Schema
          </button>
          <button
            onClick={() => setView('final')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === 'final' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🖼️ Final
          </button>
        </div>
      </div>

      {/* Schema cu simboluri + riglă numerotată */}
      {view === 'schema' && (
        <div className="overflow-auto border border-gray-200 rounded-lg">
          <div style={{ display: 'inline-block', minWidth: 'max-content' }}>
            {/* Riglă sus */}
            <div style={{ display: 'flex', paddingLeft: 24 }}>
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
              {/* Riglă stânga */}
              <div style={{ width: 24, position: 'relative', flexShrink: 0 }}>
                {Array.from({ length: Math.floor(schema.heightStitches / 10) + 1 }, (_, i) => {
                  const row = i * 10
                  if (row >= schema.heightStitches) return null
                  return (
                    <div
                      key={row}
                      style={{
                        position: 'absolute',
                        top: row * CELL_SIZE,
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

              {/* Grilă */}
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${schema.widthStitches}, ${CELL_SIZE}px)` }}>
                {schema.grid.map((row, y) =>
                  row.map((colorIdx, x) => {
                    const color = schema.colors[colorIdx]
                    const isRuler = x % 10 === 0 || y % 10 === 0
                    return (
                      <div
                        key={`${y}-${x}`}
                        title={`${color.dmcColor.code} ${color.symbol}`}
                        style={{
                          width: CELL_SIZE, height: CELL_SIZE,
                          backgroundColor: color.dmcColor.hex,
                          border: isRuler ? '0.5px solid rgba(0,0,0,0.3)' : '0.5px solid rgba(0,0,0,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: CELL_SIZE > 8 ? CELL_SIZE * 0.6 : 0,
                          color: 'rgba(0,0,0,0.5)', lineHeight: 1,
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

      {/* Preview final — canvas pixel art */}
      {view === 'final' && (
        <div className="overflow-auto border border-gray-200 rounded-lg">
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
      <div>
        <h3 className="font-medium text-gray-800 mb-3">Culori folosite ({schema.colors.length})</h3>
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {[...schema.colors]
            .sort((a, b) => b.count - a.count)
            .map((color, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div
                  className="w-6 h-6 rounded border border-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: color.dmcColor.hex, color: 'rgba(0,0,0,0.6)' }}
                >
                  {color.symbol}
                </div>
                <span className="font-mono text-gray-700 w-14 text-xs">DMC {color.dmcColor.code}</span>
                <span className="text-gray-500 flex-1 text-xs">{color.dmcColor.name}</span>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {color.skeins} {color.unit === 'packets' ? 'pach.' : 'scule'}
                </span>
              </div>
            ))}
        </div>
      </div>

      <div className="text-xs text-gray-400 border-t pt-3">
        {schema.widthStitches * schema.heightStitches} puncte total • {schema.colors.length} culori DMC
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { GeneratedSchema, DmcColor, ColorUsage, CraftType, CanvasType } from '@/types'
import type { AnalysisResult } from '@/lib/schema/analyzeImage'
import { getCategoricalColor, SOLID_THRESHOLD, SIMPLE_SYMBOLS } from '@/lib/dmc/categoricalColors'
import { LanguageToggle } from '@/components/LanguageToggle'
import { t } from '@/lib/i18n/translations'
import type { Lang } from '@/lib/i18n/translations'

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
  const [threadType, setThreadType] = useState<'wool' | 'silk' | 'cotton'>('wool')
  const [widthCm, setWidthCm] = useState(30)
  const [heightCm, setHeightCm] = useState(25)
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [maxColors, setMaxColors] = useState(30)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GeneratedSchema | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settingsChanged, setSettingsChanged] = useState(false)
  const [imgBrightness, setImgBrightness] = useState(1.0)
  const [imgContrast, setImgContrast] = useState(1.0)
  const [imgSaturation, setImgSaturation] = useState(1.0)
  const [portraitMode, setPortraitMode] = useState(false)
  const [variants, setVariants] = useState<Array<{ schema: GeneratedSchema; nColors: number }> | null>(null)
  const [activeVariant, setActiveVariant] = useState(0)
  const [aiSteps, setAiSteps] = useState<{ upscaled: boolean; faceEnhanced: boolean; sharpened: boolean } | null>(null)
  const [schemaId, setSchemaId] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState<'schema' | 'fabric' | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  // Preprocessing Premium
  const [preprocessedBlob, setPreprocessedBlob] = useState<Blob | null>(null)
  const [preprocessedPreview, setPreprocessedPreview] = useState<string | null>(null)
  const [preprocessedSteps, setPreprocessedSteps] = useState<{ upscaled: boolean; faceEnhanced: boolean; sharpened: boolean } | null>(null)
  const [preprocessing, setPreprocessing] = useState(false)
  const [usePreprocessed, setUsePreprocessed] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Resetează canvasType doar dacă nu e compatibil cu noul tip de lucrare
  useEffect(() => {
    if (craftType === 'diamond') {
      if (!['2.5mm', '2.8mm', '3.0mm'].includes(canvasType)) setCanvasType('2.5mm')
    } else if (craftType === 'goblene') {
      if (!['10mesh', '12mesh', '14mesh', '18mesh'].includes(canvasType)) setCanvasType('14mesh')
    } else {
      if (!['11CT', '14CT', '16CT', '18CT'].includes(canvasType)) setCanvasType('14CT')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [craftType])


  const canGenerate = subscription?.status === 'active' &&
    (subscription?.plan !== 'free_trial' || subscription?.schemas_remaining > 0)
  const isPremium = subscription?.plan === 'premium'

  function handleImage(file: File) {
    setImage(file)
    setResult(null)
    setVariants(null)
    setError(null)
    setSettingsChanged(false)
    setAiSteps(null)
    setAnalysis(null)
    setImgBrightness(1.0)
    setImgContrast(1.0)
    setImgSaturation(1.0)
    setPortraitMode(false)
    setPreprocessedBlob(null)
    setPreprocessedPreview(null)
    setPreprocessedSteps(null)
    setPreprocessing(false)
    setUsePreprocessed(false)
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

  function buildFd(nColors: number) {
    const fd = new FormData()
    if (usePreprocessed && preprocessedBlob) {
      // Generare din imaginea preprocesată AI
      // Nu trimitem originalImage separat — reduce payload (preprocess poate fi 2-3MB, original încă 2-4MB → 413)
      // Thumbnailul din Storage va fi imaginea preprocesată (reprezentativă pentru schema generată)
      fd.append('image', new File([preprocessedBlob], 'preprocessed.jpg', { type: 'image/jpeg' }))
      fd.append('skipAI', 'true')
      if (preprocessedSteps) fd.append('aiSteps', JSON.stringify(preprocessedSteps))
    } else {
      fd.append('image', image!)
      if (isPremium && preprocessedBlob !== null) fd.append('skipAI', 'true')
    }
    fd.append('craftType', craftType)
    fd.append('canvasType', canvasType)
    fd.append('widthCm', widthCm.toString())
    fd.append('heightCm', heightCm.toString())
    fd.append('maxColors', nColors.toString())
    fd.append('imgBrightness', imgBrightness.toString())
    fd.append('imgContrast', imgContrast.toString())
    fd.append('imgSaturation', imgSaturation.toString())
    fd.append('threadType', threadType)
    return fd
  }

  async function handlePreprocess() {
    if (!image) return
    setPreprocessing(true)
    setError(null)
    setPreprocessedBlob(null)
    setPreprocessedPreview(null)
    setUsePreprocessed(false)
    try {
      const fd = new FormData()
      fd.append('image', image)
      const res = await fetch('/api/preprocess', { method: 'POST', body: fd })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare procesare AI')
      }
      const steps = res.headers.get('X-AI-Steps')
      const blob = await res.blob()
      setPreprocessedBlob(blob)
      setPreprocessedPreview(URL.createObjectURL(blob))
      setPreprocessedSteps(steps ? JSON.parse(steps) : null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPreprocessing(false)
    }
  }

  async function handleAnalyze() {
    if (!image) return
    setAnalyzing(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('image', image)
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Eroare analiză')
      setAnalysis(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  function applyRecommendation(rec: AnalysisResult['recommendations'][0]) {
    const isDiamond = rec.isDiamond
    const craft = isDiamond ? 'diamond' : rec.isGoblene ? 'goblene' : 'cross_stitch'
    setCraftType(craft)
    setCanvasType(rec.canvasType)
    setWidthCm(rec.minWidthCm)
    setHeightCm(rec.minHeightCm)
    setMaxColors(rec.optimalColors)
    const isPortrait = rec.minHeightCm > rec.minWidthCm
    setOrientation(isPortrait ? 'portrait' : 'landscape')
    if (result) setSettingsChanged(true)
  }

  async function downloadPdf(type: 'schema' | 'fabric') {
    if (!schemaId) return
    setPdfLoading(type)
    setError(null)
    try {
      const res = await fetch(`/api/pdf/${schemaId}${type === 'fabric' ? '?type=fabric' : ''}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Eroare la generarea PDF (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'fabric' ? 'tiparire-pinza-1x1.pdf' : 'schema-pointart.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPdfLoading(null)
    }
  }

  async function handleGenerate() {
    if (!image || !canGenerate) return
    setLoading(true)
    setError(null)
    setVariants(null)

    try {
      const res = await fetch('/api/generate', { method: 'POST', body: buildFd(maxColors) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Eroare necunoscută')
      setResult(data.schema)
      setSchemaId(data.schemaId ?? null)
      setAiSteps(data.aiSteps ?? null)
      setSettingsChanged(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGenerateVariants() {
    if (!image || !canGenerate) return
    setLoading(true)
    setError(null)
    setResult(null)
    setVariants(null)

    try {
      const results = await Promise.all(
        [20, 35, 50].map(async (nColors) => {
          const res = await fetch('/api/generate', { method: 'POST', body: buildFd(nColors) })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Eroare necunoscută')
          return { schema: data.schema as GeneratedSchema, nColors }
        })
      )
      setVariants(results)
      setActiveVariant(1)
      setResult(results[1].schema)
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
            <Link href="/dashboard" className="flex items-center gap-1 text-gray-400 hover:text-violet-700 hover:bg-violet-50 rounded-lg px-2 py-1 transition-colors cursor-pointer select-none">
              <span className="text-lg leading-none">←</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xl">🧵</span>
              <span className="font-bold text-violet-700">PointArt</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle lang={lang} />
            <Link href="/generate" className="text-sm font-medium text-violet-700 hover:text-violet-900 transition-colors hidden sm:block">
              {t(lang, 'generate.new_schema')}
            </Link>
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
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                    style={{ filter: `brightness(${imgBrightness}) contrast(${imgContrast}) saturate(${imgSaturation})` }}
                  />
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

            {/* AI Preprocessing — doar Premium, după upload */}
            {isPremium && image && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-amber-600 font-bold text-sm">★ Premium AI</span>
                  <span className="text-xs text-amber-700">Îmbunătățire imagine cu AI înainte de generare</span>
                </div>

                {!preprocessedPreview && !preprocessing && (
                  <div className="space-y-3">
                    <p className="text-xs text-amber-700">
                      Aplică upscaling 4×, îmbunătățire portret și claritate optimizată (30–60 sec)
                    </p>
                    <button
                      onClick={handlePreprocess}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
                    >
                      ✨ Îmbunătățește imaginea cu AI
                    </button>
                    <p className="text-xs text-amber-600 bg-amber-100 rounded-lg px-3 py-2">
                      Rezultat optim pe <strong>portrete individuale</strong>. Fotografii de grup sau peisaje → generează direct fără AI.
                    </p>
                  </div>
                )}

                {preprocessing && (
                  <div className="flex items-center justify-center gap-3 py-4">
                    <svg className="w-5 h-5 animate-spin text-amber-600" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    <span className="text-sm text-amber-700 font-medium">Procesare AI... (30–60 sec)</span>
                  </div>
                )}

                {preprocessedPreview && (
                  <div className="space-y-4">
                    {/* Comparație before/after */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 text-center mb-1.5">Original</p>
                        {preview && preview !== '__heic__' ? (
                          <img src={preview} alt="Original" className="w-full rounded-lg border border-gray-200" />
                        ) : (
                          <div className="w-full h-32 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-400">HEIC</div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-amber-600 font-semibold text-center mb-1.5">★ AI Enhanced</p>
                        <img src={preprocessedPreview} alt="AI Enhanced" className="w-full rounded-lg border border-amber-300" />
                      </div>
                    </div>

                    {/* Pași AI aplicați */}
                    {preprocessedSteps && (
                      <div className="flex flex-wrap gap-1.5">
                        {preprocessedSteps.upscaled && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">↑ mărită 4×</span>}
                        {preprocessedSteps.faceEnhanced && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">👤 portret îmbunătățit</span>}
                        {preprocessedSteps.sharpened && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">◈ claritate optimizată</span>}
                      </div>
                    )}

                    {/* Butoane accept/cancel */}
                    {usePreprocessed ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</span>
                          Imaginea AI selectată
                        </span>
                        <button
                          onClick={() => setUsePreprocessed(false)}
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Revino la original
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setUsePreprocessed(true)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                        >
                          Folosește imaginea AI
                        </button>
                        <button
                          onClick={() => { setPreprocessedPreview(null); setPreprocessedBlob(null); setPreprocessedSteps(null) }}
                          className="px-4 py-2 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-xl text-sm transition-colors"
                        >
                          Anulează
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Ajustare imagine — apare doar după upload */}
            {preview && preview !== '__heic__' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">✨ Ajustare imagine</h2>
                    <p className="text-xs text-gray-400">Preview instant — se aplică la generare</p>
                  </div>
                  {(imgBrightness !== 1 || imgContrast !== 1 || imgSaturation !== 1 || portraitMode) && (
                    <button
                      onClick={() => { setImgBrightness(1); setImgContrast(1); setImgSaturation(1); setPortraitMode(false) }}
                      className="text-xs text-gray-400 hover:text-violet-600 transition-colors"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {([
                    { label: '☀️ Luminozitate', value: imgBrightness, set: setImgBrightness, min: 0.5, max: 1.5 },
                    { label: '◑ Contrast',      value: imgContrast,   set: setImgContrast,   min: 0.5, max: 1.5 },
                    { label: '🎨 Saturație',    value: imgSaturation, set: setImgSaturation, min: 0.5, max: 2.0 },
                  ] as const).map(({ label, value, set, min, max }) => (
                    <div key={label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className={`font-semibold ${value !== 1 ? 'text-violet-600' : 'text-gray-400'}`}>
                          {Math.round(value * 100)}%
                        </span>
                      </div>
                      <input
                        type="range" min={min} max={max} step={0.05} value={value}
                        onChange={e => { set(Number(e.target.value)); if (result) setSettingsChanged(true) }}
                        className="w-full accent-violet-600 h-1.5"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-3 mt-1 border-t border-gray-100">
                  <button
                    onClick={() => {
                      const next = !portraitMode
                      setPortraitMode(next)
                      setImgSaturation(next ? 0.78 : 1.0)
                      if (result) setSettingsChanged(true)
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full ${
                      portraitMode
                        ? 'bg-violet-50 text-violet-700 border border-violet-200'
                        : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700'
                    }`}
                  >
                    <span className="text-base">👤</span>
                    <div className="text-left flex-1">
                      <div className="leading-tight">Mod portret</div>
                      <div className="text-xs font-normal opacity-60 leading-tight">Saturație redusă pentru ten deschis</div>
                    </div>
                    <div className={`w-8 h-5 rounded-full transition-colors flex items-center px-0.5 ${
                      portraitMode ? 'bg-violet-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Analiză imagine */}
            {image && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">2. Analiză imagine</h2>
                    <p className="text-xs text-gray-400">Recomandări automate de dimensiuni și culori</p>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex items-center gap-2 bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-violet-800 transition-colors disabled:opacity-60"
                  >
                    {analyzing ? (
                      <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg> Analizez...</>
                    ) : '🔍 Analizează imaginea'}
                  </button>
                </div>

                {analysis && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm text-gray-600">Complexitate:</span>
                      <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                        analysis.complexityScore >= 8 ? 'bg-red-100 text-red-700' :
                        analysis.complexityScore >= 6 ? 'bg-orange-100 text-orange-700' :
                        analysis.complexityScore >= 4 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{analysis.complexityLabel} ({analysis.complexityScore}/10)</span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Pânză</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Culori</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Dimensiuni min.</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Timp est.</th>
                            <th className="px-3 py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {analysis.recommendations.map(rec => {
                            const isSuggested = rec.canvasType === analysis.suggestedCanvas
                            return (
                              <tr
                                key={rec.canvasType}
                                className={`transition-colors ${isSuggested ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                              >
                                <td className="px-3 py-2 font-medium text-gray-800">
                                  {rec.isDiamond
                                    ? <span className="mr-1">💎</span>
                                    : rec.isGoblene
                                    ? <span className="mr-1">🧵</span>
                                    : <span className="mr-1 text-rose-500 font-bold">✕</span>
                                  }{rec.canvasType}
                                  {isSuggested && <span className="ml-1 text-xs text-violet-500">★</span>}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-700">{rec.optimalColors}</td>
                                <td className="px-3 py-2 text-center text-gray-700">{rec.minWidthCm}×{rec.minHeightCm} cm</td>
                                <td className="px-3 py-2 text-center text-gray-500 text-xs">{(() => {
                                  const total = Math.round(rec.minWidthCm * rec.stitchesPerCm) * Math.round(rec.minHeightCm * rec.stitchesPerCm)
                                  const spm = rec.isDiamond ? 4.5 : rec.isGoblene ? 2 : 2.5
                                  const h = Math.round(total / spm / 60)
                                  const mo = Math.round(h / 120)
                                  return mo >= 2 ? `~${mo} luni` : `~${h} ore`
                                })()}</td>
                                <td className="px-3 py-2 text-right">
                                  <button
                                    onClick={() => applyRecommendation(rec)}
                                    className="text-xs bg-violet-100 text-violet-700 hover:bg-violet-200 px-2 py-1 rounded-lg font-medium transition-colors"
                                  >
                                    Aplică
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">★ Recomandat · <span className="text-rose-500 font-semibold">✕</span> Cross Stitch · 💎 Diamante · 🧵 Goblen · Click <strong>Aplică</strong> pentru a completa automat setările</p>
                  </div>
                )}
              </div>
            )}

            {/* Tip lucrare */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">{image ? '3.' : '2.'} Tip de lucrare</h2>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'cross_stitch', label: 'Cross Stitch', icon: '✕', iconClass: 'text-rose-500 font-bold' },
                  { value: 'goblene',      label: 'Goblene',      icon: '🧵', iconClass: '' },
                  { value: 'diamond',      label: 'Diamante',     icon: '💎', iconClass: '' },
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
                    <div className={`text-2xl mb-1 ${t.iconClass}`}>{t.icon}</div>
                    <div className="text-sm font-medium text-gray-700">{t.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tip ață goblen */}
            {craftType === 'goblene' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-1">4. Tip ață</h2>
                <p className="text-xs text-gray-400 mb-4">Afectează calculul cantității necesare</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: 'wool',   icon: '🐑', label: 'Lână',    desc: 'DMC Tapestry' },
                    { value: 'silk',   icon: '🪡', label: 'Mătase',  desc: 'DMC Silk' },
                    { value: 'cotton', icon: '🌿', label: 'Bumbac',  desc: 'DMC Cotton' },
                  ] as const).map(t => (
                    <button
                      key={t.value}
                      onClick={() => changeSetting(() => setThreadType(t.value))}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        threadType === t.value
                          ? 'border-violet-500 bg-violet-50'
                          : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{t.icon}</div>
                      <div className="text-sm font-medium text-gray-700">{t.label}</div>
                      <div className="text-xs text-gray-400">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas broderie */}
            {craftType === 'cross_stitch' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">3. Canvas Aida</h2>
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

            {/* Canvas goblen — mesh count */}
            {craftType === 'goblene' && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-1">3. Canvas Mono (mesh)</h2>
                <p className="text-xs text-gray-400 mb-4">Ochiuri per inch — pânză Zweigart sau similară</p>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { ct: '10mesh', label: '10 mesh', thread: '1 fir lână', desc: '3.9 pt/cm — gros' },
                    { ct: '12mesh', label: '12 mesh', thread: '1 fir lână', desc: '4.7 pt/cm — mediu' },
                    { ct: '14mesh', label: '14 mesh', thread: '1 fir lână', desc: '5.5 pt/cm — standard ★' },
                    { ct: '18mesh', label: '18 mesh', thread: '1 fir lână', desc: '7.1 pt/cm — fin' },
                  ] as const).map(({ ct, label, thread, desc }) => (
                    <button
                      key={ct}
                      onClick={() => changeSetting(() => setCanvasType(ct))}
                      className={`p-3 rounded-xl border-2 text-center transition-colors ${
                        canvasType === ct ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'
                      }`}
                    >
                      <div className="font-bold text-gray-900">{label}</div>
                      <div className="text-xs text-violet-600">{thread}</div>
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Înălțime (cm)</label>
                  <input type="number" value={heightCm} min={5} max={200}
                    onChange={e => changeSetting(() => setHeightCm(Number(e.target.value)))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {(() => {
                  const spc: Record<string, number> = {
                    '11CT': 4.3, '14CT': 5.5, '16CT': 6.3, '18CT': 7.1,
                    '2.5mm': 4.0, '2.8mm': 3.571, '3.0mm': 3.333,
                    '10mesh': 3.94, '12mesh': 4.72, '14mesh': 5.51, '18mesh': 7.09,
                  }
                  const density = spc[canvasType] ?? 5.5
                  const unit = craftType === 'diamond' ? 'diamante' : 'puncte'
                  const w = Math.round(widthCm * density)
                  const h = Math.round(heightCm * density)
                  const total = w * h
                  const spm = craftType === 'diamond' ? 4.5 : craftType === 'goblene' ? 2 : 2.5
                  const hours = Math.round(total / spm / 60)
                  const months = Math.round(hours / (4 * 30))
                  const timeLabel = hours < 100
                    ? `~${hours} ore`
                    : months < 2
                    ? `~${hours} ore (~${Math.round(hours/4)} zile la 4h/zi)`
                    : `~${hours} ore (~${months} luni la 4h/zi)`
                  return `→ ${w} × ${h} ${unit} · ${timeLabel}`
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

            <div className="space-y-3">
              {isPremium && usePreprocessed && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-xs text-green-700 flex items-center gap-2">
                  <span>✓</span>
                  <span>Schema se va genera din imaginea îmbunătățită AI</span>
                </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!image || loading || !canGenerate}
                className="w-full bg-violet-700 text-white py-4 rounded-xl font-semibold text-lg hover:bg-violet-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? '⏳ Generez schema...'
                  : settingsChanged ? '🔄 Regenerează schema' : '✨ Generează schema'}
              </button>
              <button
                onClick={handleGenerateVariants}
                disabled={!image || loading || !canGenerate}
                className="w-full bg-white border-2 border-violet-700 text-violet-700 py-3 rounded-xl font-semibold hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                ⚡ 3 variante simultan (20 / 35 / 50 culori)
              </button>
            </div>

            {!canGenerate && (
              <p className="text-center text-sm text-red-500">
                Ai depășit limita planului. <Link href="/pricing" className="underline">Upgrade</Link>
              </p>
            )}
          </div>

          {/* Coloana dreapta — preview rezultat */}
          <div className="space-y-4">
            {result && aiSteps && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex flex-wrap gap-2 text-xs text-amber-700 font-medium">
                <span>★ AI Premium</span>
                {aiSteps.upscaled && <span>· imagine mărită 4×</span>}
                {aiSteps.faceEnhanced && <span>· portret îmbunătățit</span>}
                {aiSteps.sharpened && <span>· claritate optimizată</span>}
              </div>
            )}
            {result && subscription?.plan !== 'free_trial' && (
              <div className="flex flex-col gap-2">
                {schemaId ? (
                  <>
                    <button
                      onClick={() => downloadPdf('schema')}
                      disabled={pdfLoading !== null}
                      className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {pdfLoading === 'schema' ? '⏳ Generez PDF...' : '📄 Descarcă PDF schemă'}
                    </button>
                    <button
                      onClick={() => downloadPdf('fabric')}
                      disabled={pdfLoading !== null}
                      className="w-full bg-violet-700 text-white py-3 rounded-xl font-semibold hover:bg-violet-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {pdfLoading === 'fabric' ? '⏳ Generez PDF...' : '🖨️ Tipărire pe pânză (1:1)'}
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-center text-gray-400">Generează o schemă nouă pentru a descărca PDF</p>
                )}
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
            {variants && (
              <div className="bg-white rounded-2xl border border-gray-200 p-1.5 flex gap-1">
                {variants.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveVariant(i); setResult(v.schema) }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      activeVariant === i
                        ? 'bg-violet-700 text-white shadow-sm'
                        : 'text-gray-500 hover:text-violet-700 hover:bg-violet-50'
                    }`}
                  >
                    {v.nColors} culori
                  </button>
                ))}
              </div>
            )}
            {result ? (
              <SchemaPreview schema={result} craftType={craftType} />
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

function contrastColor(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#000000'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000'
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '#000000' : '#ffffff'
}

function buildColors(colors: GeneratedSchema['colors'], craftType = 'cross_stitch') {
  const isGoblene = craftType === 'goblene'
  const withIdx = colors.map((c, i) => ({ ...c, _idx: i }))
  const sorted = [...withIdx].sort((a, b) => b.count - a.count)
  const byRank = new Map<number, { symbol: string; catColor: string; isSolid: boolean }>()
  sorted.forEach((c, rank) => byRank.set(c._idx, {
    symbol: rank >= SOLID_THRESHOLD
      ? (SIMPLE_SYMBOLS[rank - SOLID_THRESHOLD] ?? '?')
      : '',
    catColor: getCategoricalColor(rank),
    isSolid: rank < SOLID_THRESHOLD,
  }))
  return withIdx.map(c => ({
    ...c,
    symbol: isGoblene ? (c.symbol || '') : (byRank.get(c._idx)?.symbol ?? ''),
    catColor: byRank.get(c._idx)?.catColor ?? '#cccccc',
    isSolid: isGoblene ? false : (byRank.get(c._idx)?.isSolid ?? false),
  }))
}

function SchemaPreview({ schema, craftType }: { schema: GeneratedSchema; craftType: string }) {
  const [view, setView] = useState<'schema' | 'final'>('schema')
  const [localColors, setLocalColors] = useState(() => buildColors(schema.colors, craftType))
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const schemaCanvasRef = useRef<HTMLCanvasElement>(null)
  const _cell = Math.max(12, Math.min(20, Math.floor(700 / schema.widthStitches)))
  const _totalPx = schema.widthStitches * _cell * schema.heightStitches * _cell
  const CELL_SIZE = _totalPx > 9_000_000
    ? Math.max(5, Math.floor(Math.sqrt(9_000_000 / (schema.widthStitches * schema.heightStitches))))
    : _cell
  const isCrossStitch = craftType === 'cross_stitch'
  const isGoblene = craftType === 'goblene'

  // Resetează culorile locale când se generează o schemă nouă
  useEffect(() => {
    setLocalColors(buildColors(schema.colors, craftType))
    setEditingIdx(null)
  }, [schema, craftType])

  // Guard sincron: dacă schema s-a schimbat dar useEffect nu s-a executat încă,
  // localColors poate fi din schema anterioară (altă dimensiune) → folosim schema.colors direct
  const effectiveColors: ColorUsage[] = localColors.length === schema.colors.length ? localColors : schema.colors

  // Randează preview final cu localColors (include swap-urile utilizatorului)
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
        ctx.fillStyle = effectiveColors[colorIdx].dmcColor.hex
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }, [view, schema, effectiveColors])

  // Randează schema pe canvas (înlocuiește grila DOM care crapa Chrome la >10k celule)
  useEffect(() => {
    if (view !== 'schema' || !schemaCanvasRef.current) return
    const canvas = schemaCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const S = CELL_SIZE
    const OX = 24  // offset left ruler
    const OY = 14  // offset top ruler

    canvas.width = schema.widthStitches * S + OX
    canvas.height = schema.heightStitches * S + OY

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Celule
    for (let y = 0; y < schema.heightStitches; y++) {
      for (let x = 0; x < schema.widthStitches; x++) {
        const colorIdx = schema.grid[y][x]
        const color = effectiveColors[colorIdx]
        const px = OX + x * S
        const py = OY + y * S

        ctx.fillStyle = isGoblene
          ? color.dmcColor.hex
          : isCrossStitch
            ? (color.isSolid ? (color.catColor ?? '#cccccc') : '#ffffff')
            : color.dmcColor.hex
        ctx.fillRect(px, py, S, S)

        const sym = isCrossStitch ? (color.isSolid ? '' : color.symbol) : color.symbol
        if (sym) {
          ctx.fillStyle = isCrossStitch ? (color.catColor ?? '#cccccc') : contrastColor(color.dmcColor.hex)
          ctx.font = `bold ${Math.max(S * 0.78, 8)}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(sym, px + S / 2, py + S / 2)
        }
      }
    }

    // Linii grilă + riglă
    ctx.font = '9px sans-serif'
    for (let x = 0; x <= schema.widthStitches; x++) {
      const px = OX + x * S
      const isTen = x % 10 === 0
      ctx.strokeStyle = isTen ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)'
      ctx.lineWidth = isTen ? 0.6 : 0.3
      ctx.beginPath(); ctx.moveTo(px, OY); ctx.lineTo(px, canvas.height); ctx.stroke()
      if (isTen && x > 0) {
        ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
        ctx.fillText(String(x), px, OY - 2)
      }
    }
    for (let y = 0; y <= schema.heightStitches; y++) {
      const py = OY + y * S
      const isTen = y % 10 === 0
      ctx.strokeStyle = isTen ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)'
      ctx.lineWidth = isTen ? 0.6 : 0.3
      ctx.beginPath(); ctx.moveTo(OX, py); ctx.lineTo(canvas.width, py); ctx.stroke()
      if (isTen && y > 0) {
        ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'right'; ctx.textBaseline = 'top'
        ctx.fillText(String(y), OX - 2, py + 1)
      }
    }

    // Highlight culoare selectată (editingIdx)
    if (editingIdx !== null) {
      ctx.strokeStyle = '#7c3aed'
      ctx.lineWidth = 1.5
      for (let y = 0; y < schema.heightStitches; y++) {
        for (let x = 0; x < schema.widthStitches; x++) {
          if (schema.grid[y][x] === editingIdx) {
            ctx.strokeRect(OX + x * S + 0.75, OY + y * S + 0.75, S - 1.5, S - 1.5)
          }
        }
      }
    }
  }, [view, schema, effectiveColors, isCrossStitch, isGoblene, CELL_SIZE, editingIdx])

  const handleSchemaClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = schemaCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const OX = 24
    const OY = 14
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const cx = Math.floor(((e.clientX - rect.left) * scaleX - OX) / CELL_SIZE)
    const cy = Math.floor(((e.clientY - rect.top) * scaleY - OY) / CELL_SIZE)
    if (cx >= 0 && cx < schema.widthStitches && cy >= 0 && cy < schema.heightStitches) {
      const colorIdx = schema.grid[cy][cx]
      setEditingIdx(prev => prev === colorIdx ? null : colorIdx)
    }
  }, [schema, CELL_SIZE])

  function swapColor(origIdx: number, newDmc: DmcColor) {
    setLocalColors(prev => prev.map((c, i) =>
      i === origIdx ? { ...c, dmcColor: newDmc } : c
    ))
    setEditingIdx(null)
  }

  // Păstrăm indexul original în tabloul colors pentru swap corect
  const sortedWithOrigIdx = [...effectiveColors]
    .map((c, i) => ({ ...c, origIdx: i }))
    .sort((a, b) => b.count - a.count)

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

      {/* Schema cu simboluri — canvas (înlocuiește grila DOM care crapa Chrome la >10k celule) */}
      {view === 'schema' && (
        <div className="overflow-auto border border-gray-200 rounded-lg">
          <canvas
            ref={schemaCanvasRef}
            onClick={handleSchemaClick}
            style={{ display: 'block', maxWidth: '100%', cursor: 'crosshair' }}
          />
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

      {/* Legendă culori cu editare */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-800">Culori folosite ({effectiveColors.length})</h3>
          <p className="text-xs text-gray-400">Click pe culoare pentru a o schimba</p>
        </div>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          {sortedWithOrigIdx.map((color, i) => {
            const origIdx = color.origIdx
            const isEditing = editingIdx === origIdx
            return (
              <div key={origIdx}>
                {/* Rândul culorii */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xs font-bold text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                  <button
                    onClick={() => setEditingIdx(isEditing ? null : origIdx)}
                    className={`w-6 h-6 rounded border-2 flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all ${
                      isEditing
                        ? 'border-violet-500 ring-2 ring-violet-300 scale-110'
                        : 'border-gray-300 hover:border-violet-400 hover:scale-110'
                    }`}
                    style={{
                      backgroundColor: isGoblene
                        ? color.dmcColor.hex
                        : isCrossStitch
                        ? (color.isSolid ? color.catColor : '#ffffff')
                        : color.dmcColor.hex,
                      color: isCrossStitch ? color.catColor : contrastColor(color.dmcColor.hex),
                    }}
                    title="Click pentru a schimba culoarea"
                  >
                    {isCrossStitch ? (color.isSolid ? '' : color.symbol) : color.symbol}
                  </button>
                  {isCrossStitch && (
                    <div
                      className="w-3 h-6 rounded border border-gray-300 flex-shrink-0"
                      style={{ backgroundColor: color.dmcColor.hex }}
                      title={`Culoare reală DMC: ${color.dmcColor.name}`}
                    />
                  )}
                  <span className="font-mono text-gray-700 w-14 text-xs">DMC {color.dmcColor.code}</span>
                  <span className="text-gray-500 flex-1 text-xs truncate">{color.dmcColor.name}</span>
                  <span className="text-gray-400 text-xs whitespace-nowrap text-right">
                    {color.skeins} {color.unit === 'packets' ? 'pach.' : color.unit === 'wool_skeins' ? 'scule lână' : color.unit === 'silk_skeins' ? 'scule mătase' : color.unit === 'cotton_skeins' ? 'scule bumbac' : 'scule'} · {color.count} pct.
                  </span>
                </div>

                {/* Selector alternative — se deschide sub rândul culorii */}
                {isEditing && (
                  color.alternatives && color.alternatives.length > 0 ? (
                    <div className="mt-1.5 mb-2 bg-violet-50 border border-violet-200 rounded-xl p-3">
                      <p className="text-xs text-violet-700 font-medium mb-2">Înlocuiește cu culoare similară:</p>
                      <div className="grid grid-cols-8 gap-1.5 mb-2">
                        {color.alternatives.map(alt => (
                          <button
                            key={alt.code}
                            onClick={() => swapColor(origIdx, alt)}
                            title={`DMC ${alt.code} — ${alt.name}`}
                            className="aspect-square rounded border-2 border-transparent hover:border-violet-500 hover:scale-125 transition-all"
                            style={{ backgroundColor: alt.hex }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={() => setEditingIdx(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        ✕ Anulează
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-1 mb-1">
                      Regenerați schema (apasă Generează din nou) pentru a vedea alternative
                    </p>
                  )
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-xs text-gray-400 border-t pt-3">
        {schema.widthStitches * schema.heightStitches} puncte total • {effectiveColors.length} culori DMC
      </div>
    </div>
  )
}

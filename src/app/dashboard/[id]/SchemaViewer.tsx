'use client'

import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import type { GeneratedSchema, CraftType, CanvasType, DmcColor } from '@/types'
import { getCategoricalColor, SOLID_THRESHOLD, SIMPLE_SYMBOLS, GEOMETRIC_SYMBOLS } from '@/lib/dmc/categoricalColors'

interface SavedOverrides {
  cell?: Record<string, DmcColor>
  palette?: Record<string, DmcColor>
}

interface Props {
  schema: GeneratedSchema
  name: string
  schemaId: string
  canDownloadPdf: boolean
  craftType: CraftType
  canvasType: CanvasType | null
  savedOverrides?: SavedOverrides | null
}

function contrastColor(hex: string): string {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return '#000000'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '#000000'
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '#000000' : '#ffffff'
}

function renderShapeSvg(symbol: string, color: string, size: number) {
  const p = Math.max(size * 0.13, 1)
  const cx = size / 2
  const cy = size / 2
  const r = Math.max(size / 2 - p, 1)
  const sw = Math.max(size * 0.08, 0.6)

  let shape: ReactNode = null
  switch (symbol) {
    case '▲': shape = <polygon points={`${p},${size-p} ${size-p},${size-p} ${cx},${p}`} fill={color} />; break
    case '▼': shape = <polygon points={`${p},${p} ${size-p},${p} ${cx},${size-p}`} fill={color} />; break
    case '◀': shape = <polygon points={`${size-p},${p} ${size-p},${size-p} ${p},${cy}`} fill={color} />; break
    case '▶': shape = <polygon points={`${p},${p} ${p},${size-p} ${size-p},${cy}`} fill={color} />; break
    case '●': shape = <circle cx={cx} cy={cy} r={r} fill={color} />; break
    case '○': shape = <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />; break
    case '■': shape = <rect x={p} y={p} width={size-p*2} height={size-p*2} fill={color} />; break
    case '□': shape = <rect x={p} y={p} width={size-p*2} height={size-p*2} fill="none" stroke={color} strokeWidth={sw} />; break
    case '◆': shape = <polygon points={`${cx},${p} ${size-p},${cy} ${cx},${size-p} ${p},${cy}`} fill={color} />; break
    case '◇': shape = <polygon points={`${cx},${p} ${size-p},${cy} ${cx},${size-p} ${p},${cy}`} fill="none" stroke={color} strokeWidth={sw} />; break
    case '◐': shape = <path d={`M ${cx} ${cy-r} A ${r} ${r} 0 0 0 ${cx} ${cy+r} Z`} fill={color} />; break
    case '◑': shape = <path d={`M ${cx} ${cy-r} A ${r} ${r} 0 0 1 ${cx} ${cy+r} Z`} fill={color} />; break
    case '◒': shape = <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 0 ${cx+r} ${cy} Z`} fill={color} />; break
    case '◓': shape = <path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy} Z`} fill={color} />; break
    case '▣': shape = <g><rect x={p} y={p} width={size-p*2} height={size-p*2} fill="none" stroke={color} strokeWidth={sw} /><rect x={p+sw+0.5} y={p+sw+0.5} width={size-p*2-sw*2-1} height={size-p*2-sw*2-1} fill={color} /></g>; break
    case '▤': shape = <g>
      <rect x={p} y={p} width={size-p*2} height={size-p*2} fill="none" stroke={color} strokeWidth={sw} />
      {[0.3, 0.5, 0.7].map((t, i) => (
        <line key={i} x1={p} y1={p+(size-p*2)*t} x2={size-p} y2={p+(size-p*2)*t} stroke={color} strokeWidth={sw*0.7} />
      ))}
    </g>; break
  }
  if (!shape) return null
  return <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>{shape}</svg>
}

export function SchemaViewer({ schema, name, schemaId, canDownloadPdf, craftType, canvasType, savedOverrides }: Props) {
  const [view, setView] = useState<'schema' | 'final'>('schema')
  const [pdfLoading, setPdfLoading] = useState<'schema' | 'fabric' | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  type DmcColorEntry = (typeof schema.colors)[0]['dmcColor']
  const [colorOverrides, setColorOverrides] = useState<Map<number, DmcColorEntry>>(() => {
    if (!savedOverrides?.palette) return new Map()
    return new Map(Object.entries(savedOverrides.palette).map(([k, v]) => [Number(k), v]))
  })
  const [cellOverrides, setCellOverrides] = useState<Map<string, DmcColorEntry>>(() => {
    if (!savedOverrides?.cell) return new Map()
    return new Map(Object.entries(savedOverrides.cell))
  })
  const [selectedRegion, setSelectedRegion] = useState<Set<string> | null>(null)
  const [regionSrcIdx, setRegionSrcIdx] = useState<number | null>(null)
  const [undoStack, setUndoStack] = useState<Array<{ cell: Map<string, DmcColorEntry>; palette: Map<number, DmcColorEntry> }>>([])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const body: SavedOverrides = {
      cell: Object.fromEntries(cellOverrides),
      palette: Object.fromEntries([...colorOverrides.entries()].map(([k, v]) => [String(k), v])),
    }
    const res = await fetch(`/api/schemas/${schemaId}/overrides`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function pushUndo() {
    setUndoStack(prev => [...prev.slice(-19), { cell: new Map(cellOverrides), palette: new Map(colorOverrides) }])
  }

  function handleUndo() {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setCellOverrides(last.cell)
      setColorOverrides(last.palette)
      return prev.slice(0, -1)
    })
  }

  async function downloadPdf(type: 'schema' | 'fabric') {
    setPdfLoading(type)
    setPdfError(null)
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
      setPdfError(e.message)
    } finally {
      setPdfLoading(null)
    }
  }
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const schemaCanvasRef = useRef<HTMLCanvasElement>(null)
  const _cell = Math.max(12, Math.min(20, Math.floor(700 / schema.widthStitches)))
  const _totalPx = schema.widthStitches * _cell * schema.heightStitches * _cell
  const CELL_SIZE = _totalPx > 9_000_000
    ? Math.max(5, Math.floor(Math.sqrt(9_000_000 / (schema.widthStitches * schema.heightStitches))))
    : _cell
  const effectiveCellSize = Math.max(6, Math.min(48, Math.round(CELL_SIZE * zoom)))
  const finalCellSize = Math.round(Math.max(2, Math.floor(700 / schema.widthStitches)) * zoom)
  const isCrossStitch = craftType === 'cross_stitch'
  const isGoblene = craftType === 'goblene'
  const isDiamond = craftType === 'diamond'
  const isMini    = craftType === 'mini_cross'
  const colors = (() => {
    const withIdx = schema.colors.map((c, i) => ({ ...c, _idx: i }))
    const sorted = [...withIdx].sort((a, b) => b.count - a.count)
    const byRank = new Map<number, { symbol: string; catColor: string; isSolid: boolean}>()
    sorted.forEach((c, rank) => byRank.set(c._idx, {
      symbol: rank >= SOLID_THRESHOLD
        ? (SIMPLE_SYMBOLS[rank - SOLID_THRESHOLD] ?? '?')
        : '',
      catColor: getCategoricalColor(rank),
      isSolid: rank < SOLID_THRESHOLD,
    }))
    return withIdx.map(c => ({
      ...c,
      // mini_cross: culoare DMC reală, FĂRĂ simboluri — pixel-art colorat
      symbol: (isGoblene || isDiamond || isMini) ? (c.symbol || '') : (byRank.get(c._idx)?.symbol ?? ''),
      catColor: byRank.get(c._idx)?.catColor ?? '#cccccc',
      isSolid: (isGoblene || isDiamond || isMini) ? false : (byRank.get(c._idx)?.isSolid ?? false),
    }))
  })()

  // Culori efective: suprascrie culorile schimbate de utilizator (palette-level)
  const effectiveColors = useMemo(() =>
    colors.map(c => ({
      ...c,
      dmcColor: colorOverrides.get(c._idx) ?? c.dmcColor,
    })),
    [colors, colorOverrides]
  )

  // Lookup rapid: cod DMC → intrare din paletă (pentru simboluri după cellOverride)
  const dmcCodeToColor = useMemo(() => {
    const m = new Map<string, typeof effectiveColors[0]>()
    for (const c of effectiveColors) m.set(c.dmcColor.code, c)
    return m
  }, [effectiveColors])

  // Recalculează count + skeins pe baza cellOverrides (region-level)
  const effectiveCounts = useMemo(() => {
    const counts = new Map<number, number>()
    for (const c of colors) counts.set(c._idx, c.count)

    for (const [key, overrideDmc] of cellOverrides) {
      const [y, x] = key.split(',').map(Number)
      const originalIdx = schema.grid[y][x]
      if (originalIdx < 0) continue
      counts.set(originalIdx, (counts.get(originalIdx) ?? 1) - 1)
      const targetColor = colors.find(c => c.dmcColor.code === overrideDmc.code)
      if (targetColor) counts.set(targetColor._idx, (counts.get(targetColor._idx) ?? 0) + 1)
    }

    return counts
  }, [colors, cellOverrides, schema.grid])

  useEffect(() => {
    if (view !== 'final' || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const scale = finalCellSize
    canvas.width = schema.widthStitches * scale
    canvas.height = schema.heightStitches * scale
    for (let y = 0; y < schema.heightStitches; y++) {
      for (let x = 0; x < schema.widthStitches; x++) {
        const cellKey = `${y},${x}`
        const gridVal = schema.grid[y][x]
        if (gridVal < 0) continue  // celulă goală (fundal exclus)
        const cellDmc = cellOverrides.get(cellKey)
        ctx.fillStyle = cellDmc ? cellDmc.hex : effectiveColors[gridVal].dmcColor.hex
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
    if (selectedRegion) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.40)'
      for (const key of selectedRegion) {
        const [ky, kx] = key.split(',').map(Number)
        ctx.fillRect(kx * scale, ky * scale, scale, scale)
      }
    }
  }, [view, schema, effectiveColors, cellOverrides, selectedRegion, finalCellSize])

  useEffect(() => {
    if (view !== 'schema' || !schemaCanvasRef.current) return
    const canvas = schemaCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const S = effectiveCellSize
    const OX = 28
    const OY = 14

    canvas.width = schema.widthStitches * S + OX
    canvas.height = schema.heightStitches * S + OY

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    for (let y = 0; y < schema.heightStitches; y++) {
      for (let x = 0; x < schema.widthStitches; x++) {
        const cellKey = `${y},${x}`
        if (schema.grid[y][x] < 0) continue  // celulă goală (fundal exclus) — rămâne albă
        const cellDmc = cellOverrides.get(cellKey)
        const color = effectiveColors[schema.grid[y][x]]
        // Dacă celula e modificată, folosim simbolul și categoria noii culori din paletă
        const displayColor = cellDmc ? (dmcCodeToColor.get(cellDmc.code) ?? color) : color
        const displayHex = cellDmc ? cellDmc.hex : color.dmcColor.hex
        const px = OX + x * S
        const py = OY + y * S

        ctx.fillStyle = isCrossStitch
          ? (displayColor.isSolid ? (displayColor.catColor ?? '#cccccc') : '#ffffff')
          : displayHex
        ctx.fillRect(px, py, S, S)

        const sym = isCrossStitch ? (displayColor.isSolid ? '' : displayColor.symbol) : displayColor.symbol
        if (sym) {
          ctx.fillStyle = isCrossStitch ? (displayColor.catColor ?? '#cccccc') : contrastColor(displayHex)
          ctx.font = `bold ${Math.max(S * 0.78, 8)}px monospace`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(sym, px + S / 2, py + S / 2)
        }
      }
    }

    // Evidențiere regiune selectată
    if (selectedRegion) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.30)'
      for (const key of selectedRegion) {
        const [ky, kx] = key.split(',').map(Number)
        ctx.fillRect(OX + kx * S, OY + ky * S, S, S)
      }
    }

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
  }, [view, schema, effectiveColors, dmcCodeToColor, isCrossStitch, effectiveCellSize, cellOverrides, selectedRegion])

  function floodFill(startY: number, startX: number): Set<string> {
    const srcIdx = schema.grid[startY][startX]
    if (srcIdx < 0) return new Set()  // celulă goală — nu se selectează
    const region = new Set<string>()
    const stack: [number, number][] = [[startY, startX]]
    const H = schema.heightStitches, W = schema.widthStitches
    while (stack.length) {
      const [y, x] = stack.pop()!
      const key = `${y},${x}`
      if (region.has(key) || y < 0 || y >= H || x < 0 || x >= W) continue
      if (schema.grid[y][x] !== srcIdx) continue
      region.add(key)
      stack.push([y + 1, x], [y - 1, x], [y, x + 1], [y, x - 1])
    }
    return region
  }

  useEffect(() => {
    if (!selectedRegion || selectedRegion.size === 0) setRegionSrcIdx(null)
  }, [selectedRegion])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setSelectedRegion(null); setRegionSrcIdx(null) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleSchemaClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = schemaCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const OX = 28, OY = 14
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY
    const cellX = Math.floor((clickX - OX) / effectiveCellSize)
    const cellY = Math.floor((clickY - OY) / effectiveCellSize)
    if (cellX < 0 || cellX >= schema.widthStitches || cellY < 0 || cellY >= schema.heightStitches) return
    const srcIdx = schema.grid[cellY][cellX]
    const cellKey = `${cellY},${cellX}`
    const region = floodFill(cellY, cellX)
    setSelectedRegion(prev => {
      if (!prev) return region
      if (prev.has(cellKey)) {
        // Click pe zonă deja selectată → elimină zona conectată din selecție
        const next = new Set(prev)
        for (const key of region) next.delete(key)
        return next.size === 0 ? null : next
      }
      const next = new Set(prev)
      for (const key of region) next.add(key)
      return next
    })
    setRegionSrcIdx(prev => prev ?? srcIdx)
    setEditingIdx(null)
  }, [schema, effectiveCellSize])

  const handleFinalClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY
    const cellX = Math.floor(clickX / finalCellSize)
    const cellY = Math.floor(clickY / finalCellSize)
    if (cellX < 0 || cellX >= schema.widthStitches || cellY < 0 || cellY >= schema.heightStitches) return
    const srcIdx = schema.grid[cellY][cellX]
    if (srcIdx < 0) return  // celulă goală — nu se selectează
    const cellKey = `${cellY},${cellX}`
    const region = floodFill(cellY, cellX)
    setSelectedRegion(prev => {
      if (!prev) return region
      if (prev.has(cellKey)) {
        const next = new Set(prev)
        for (const key of region) next.delete(key)
        return next.size === 0 ? null : next
      }
      const next = new Set(prev)
      for (const key of region) next.add(key)
      return next
    })
    setRegionSrcIdx(prev => prev ?? srcIdx)
    setEditingIdx(null)
  }, [schema, finalCellSize])

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
            📐 {isGoblene ? 'Schema (culori + simboluri)' : 'Schema (cu simboluri)'}
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
          <div className="flex flex-col gap-2 items-end">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => downloadPdf('schema')}
                disabled={pdfLoading !== null}
                className="bg-green-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-green-700 transition-colors text-sm inline-flex items-center gap-2 disabled:opacity-60"
              >
                {pdfLoading === 'schema' ? '⏳ Generez...' : '📄 PDF schemă'}
              </button>
              {!isMini && (
                <button
                  onClick={() => downloadPdf('fabric')}
                  disabled={pdfLoading !== null}
                  className="bg-violet-700 text-white px-5 py-2 rounded-xl font-medium hover:bg-violet-800 transition-colors text-sm inline-flex items-center gap-2 disabled:opacity-60"
                >
                  {pdfLoading === 'fabric' ? '⏳ Generez...' : '🖨️ Tipărire pânză (1:1)'}
                </button>
              )}
            </div>
            {pdfError && (
              <p className="text-red-600 text-xs">{pdfError}</p>
            )}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-amber-700 text-sm">
            📄 PDF disponibil doar pe plan plătit
          </div>
        )}
      </div>

      {/* Schema cu simboluri — canvas (previne crash Chrome la scheme mari) */}
      {view === 'schema' && (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          {/* Bara zoom */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500 font-medium">Zoom:</span>
            <button
              onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-bold flex items-center justify-center"
              title="Micșorează"
            >−</button>
            <span className="text-xs font-mono text-gray-700 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
              className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-bold flex items-center justify-center"
              title="Mărește"
            >+</button>
            <button
              onClick={() => setZoom(1)}
              className="text-xs text-violet-600 hover:text-violet-800 ml-1"
              title="Reset zoom"
            >Reset</button>
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="text-xs text-orange-600 hover:text-orange-800 ml-2 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Anulează ultima modificare de culoare"
            >↩ Anulează</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium ml-auto px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Salvează modificările de culoare în cont"
            >{saving ? '⏳ Salvez...' : saved ? '✓ Salvat' : '💾 Salvează'}</button>
          </div>
          <div className="overflow-auto p-2">
            <canvas
              ref={schemaCanvasRef}
              style={{ display: 'block' }}
            />
          </div>
        </div>
      )}

      {/* Preview final canvas */}
      {view === 'final' && (
        <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500 font-medium">Zoom:</span>
            <button
              onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))}
              className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-bold flex items-center justify-center"
              title="Micșorează"
            >−</button>
            <span className="text-xs font-mono text-gray-700 w-10 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}
              className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-bold flex items-center justify-center"
              title="Mărește"
            >+</button>
            <button
              onClick={() => setZoom(1)}
              className="text-xs text-violet-600 hover:text-violet-800 ml-1"
              title="Reset zoom"
            >Reset</button>
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="text-xs text-orange-600 hover:text-orange-800 ml-2 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Anulează ultima modificare de culoare"
            >↩ Anulează</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium ml-auto px-2.5 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Salvează modificările de culoare în cont"
            >{saving ? '⏳ Salvez...' : saved ? '✓ Salvat' : '💾 Salvează'}</button>
          </div>
          <div className="overflow-auto p-2">
            <canvas
              ref={canvasRef}
              onClick={handleFinalClick}
              style={{ display: 'block', imageRendering: 'pixelated', cursor: 'crosshair' }}
            />
          </div>
        </div>
      )}

      {/* Panou editare regiune (apare după click pe canvas) */}
      {selectedRegion && regionSrcIdx !== null && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-indigo-800">
                {selectedRegion.size} celule selectate
              </p>
              <p className="text-xs text-indigo-600 mt-0.5">
                Click pe zonă nouă = adaugă • Click pe zonă selectată = elimină • Esc = anulează
              </p>
            </div>
            <button
              onClick={() => { setSelectedRegion(null); setRegionSrcIdx(null) }}
              className="text-xs text-indigo-500 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-100"
            >✕ Anulează</button>
          </div>
          <p className="text-xs font-medium text-indigo-700 mb-2">Alege culoarea nouă din paleta schemei:</p>
          <div className="flex flex-wrap gap-1.5">
            {[...effectiveColors]
              .sort((a, b) => b.count - a.count)
              .map(c => (
                <button
                  key={c._idx}
                  onClick={() => {
                    pushUndo()
                    const newDmc = c.dmcColor
                    setCellOverrides(prev => {
                      const next = new Map(prev)
                      for (const key of selectedRegion) next.set(key, newDmc)
                      return next
                    })
                    setSelectedRegion(null)
                    setRegionSrcIdx(null)
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-colors ${
                    c._idx === regionSrcIdx
                      ? 'bg-indigo-200 border-indigo-400 text-indigo-800'
                      : 'bg-white border-gray-200 hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                  title={`${c.dmcColor.name} (DMC ${c.dmcColor.code})`}
                >
                  <span className="w-4 h-4 rounded border border-gray-200 flex-shrink-0 inline-block" style={{ backgroundColor: c.dmcColor.hex }} />
                  <span className="font-mono text-gray-700">{c.dmcColor.code}</span>
                  <span className="text-gray-400 hidden sm:inline truncate max-w-[90px]">{c.dmcColor.name}</span>
                </button>
              ))}
          </div>
          {cellOverrides.size > 0 && (
            <button
              onClick={() => setCellOverrides(new Map())}
              className="mt-3 text-xs text-red-500 hover:text-red-700"
            >↩ Resetează toate modificările de regiuni</button>
          )}
        </div>
      )}

      {/* Legendă culori */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Culori folosite ({colors.length})
        </h3>
        {/* Header tabel */}
        <div className={`grid ${isCrossStitch ? 'grid-cols-[28px_52px_1fr_auto]' : 'grid-cols-[28px_28px_1fr_auto]'} gap-x-3 pb-1.5 mb-1 border-b border-gray-200`}>
          <span className="text-[10px] font-semibold text-gray-400 text-center">#</span>
          <span className="text-[10px] font-semibold text-gray-400 text-center">Simbol</span>
          <span className="text-[10px] font-semibold text-gray-400">Culoare DMC</span>
          <span className="text-[10px] font-semibold text-gray-400 text-right">Cantitate</span>
        </div>

        <p className="text-xs text-gray-400 mb-3">Click pe schemă pentru a selecta o regiune · Click pe mai multe zone pentru a le acumula · Apoi alege culoarea nouă</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          {[...effectiveColors]
            .sort((a, b) => b.count - a.count)
            .map((color, i) => {
              const isEditing = editingIdx === color._idx
              const isOverridden = colorOverrides.has(color._idx)
              return (
                <div key={i} className="border-b border-gray-50">
                  {/* Rândul principal */}
                  <div className={`grid ${isCrossStitch ? 'grid-cols-[28px_52px_1fr_auto_28px]' : 'grid-cols-[28px_28px_1fr_auto_28px]'} items-center gap-x-3 py-1.5`}>
                    <span className="text-xs font-bold text-gray-400 text-center">{i + 1}</span>

                    {isCrossStitch ? (
                      <div className="flex items-center gap-1">
                        {color.isSolid ? (
                          <div className="w-7 h-7 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: color.catColor }} />
                        ) : (
                          <div className="w-7 h-7 rounded border border-gray-300 flex-shrink-0 flex items-center justify-center text-sm font-bold font-mono bg-white" style={{ color: color.catColor }}>
                            {GEOMETRIC_SYMBOLS.has(color.symbol) ? renderShapeSvg(color.symbol, color.catColor, 20) : color.symbol}
                          </div>
                        )}
                        <div className="w-4 h-7 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: color.dmcColor.hex }} title={`Culoare reală: ${color.dmcColor.name}`} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded border border-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold font-mono" style={{ backgroundColor: color.dmcColor.hex, color: contrastColor(color.dmcColor.hex) }}>
                        {GEOMETRIC_SYMBOLS.has(color.symbol) ? renderShapeSvg(color.symbol, contrastColor(color.dmcColor.hex), 20) : color.symbol}
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className={`text-xs font-mono font-semibold ${isOverridden ? 'text-violet-700' : 'text-gray-700'}`}>DMC {color.dmcColor.code}</p>
                      <p className="text-xs text-gray-400 truncate">{color.dmcColor.name}</p>
                    </div>

                    <div className="text-right shrink-0">
                      {(() => {
                        const effCount = effectiveCounts.get(color._idx) ?? color.count
                        const effSkeins = effCount === 0 ? 0 : Math.max(1, Math.ceil(effCount * color.skeins / Math.max(1, color.count)))
                        const changed = effCount !== color.count
                        const unitLabel = color.unit === 'packets' ? 'pach.' : color.unit === 'wool_skeins' ? 'scule lână' : color.unit === 'silk_skeins' ? 'scule mătase' : color.unit === 'cotton_skeins' ? 'scule bumbac' : 'scule'
                        return (
                          <>
                            <p className={`text-xs font-semibold ${changed ? 'text-indigo-600' : 'text-gray-700'}`}>
                              {effSkeins} {unitLabel}
                            </p>
                            <p className={`text-xs ${changed ? 'text-indigo-400' : 'text-gray-400'}`}>
                              {effCount} pct.
                            </p>
                          </>
                        )
                      })()}
                    </div>

                    {/* Buton editare */}
                    <button
                      onClick={() => setEditingIdx(isEditing ? null : color._idx)}
                      className={`w-7 h-7 rounded flex items-center justify-center text-sm transition-colors ${
                        isEditing ? 'bg-violet-100 text-violet-700' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                      }`}
                      title="Schimbă culoarea"
                    >
                      ✏️
                    </button>
                  </div>

                  {/* Panou alternative (vizibil doar când se editează) */}
                  {isEditing && (
                    <div className="bg-violet-50 rounded-lg p-3 mb-1 mx-1 space-y-3">
                      {/* Restaurare original */}
                      {isOverridden && (
                        <button
                          onClick={() => {
                            pushUndo()
                            setColorOverrides(prev => { const n = new Map(prev); n.delete(color._idx); return n })
                            setEditingIdx(null)
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-white border-2 border-gray-300 rounded-lg text-xs hover:border-violet-400 transition-colors"
                        >
                          <span className="w-4 h-4 rounded border border-gray-200 inline-block" style={{ backgroundColor: schema.colors[color._idx]?.dmcColor?.hex }} />
                          <span className="text-gray-500">↩ Restaurează originalul</span>
                        </button>
                      )}

                      {/* Alternativele pre-calculate (cele mai apropiate DMC) */}
                      {(schema.colors[color._idx]?.alternatives ?? []).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-violet-700 mb-1.5">Nuanțe apropiate:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(schema.colors[color._idx]?.alternatives ?? []).map((alt, ai) => (
                              <button
                                key={ai}
                                onClick={() => {
                                  pushUndo()
                                  setColorOverrides(prev => new Map(prev).set(color._idx, alt))
                                  setEditingIdx(null)
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs hover:border-violet-400 hover:bg-violet-50 transition-colors"
                                title={`${alt.name} (DMC ${alt.code})`}
                              >
                                <span className="w-4 h-4 rounded border border-gray-200 flex-shrink-0 inline-block" style={{ backgroundColor: alt.hex }} />
                                <span className="font-mono text-gray-600">{alt.code}</span>
                                <span className="text-gray-400 hidden sm:inline truncate max-w-[80px]">{alt.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Toate celelalte culori din paleta schemei */}
                      <div>
                        <p className="text-xs font-semibold text-violet-700 mb-1.5">Din paleta schemei:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {effectiveColors
                            .filter(c => c._idx !== color._idx)
                            .sort((a, b) => b.count - a.count)
                            .map((c) => (
                              <button
                                key={c._idx}
                                onClick={() => {
                                  pushUndo()
                                  setColorOverrides(prev => new Map(prev).set(color._idx, c.dmcColor))
                                  setEditingIdx(null)
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs hover:border-violet-400 hover:bg-violet-50 transition-colors"
                                title={`${c.dmcColor.name} (DMC ${c.dmcColor.code})`}
                              >
                                <span className="w-4 h-4 rounded border border-gray-200 flex-shrink-0 inline-block" style={{ backgroundColor: c.dmcColor.hex }} />
                                <span className="font-mono text-gray-600">{c.dmcColor.code}</span>
                                <span className="text-gray-400 hidden sm:inline truncate max-w-[80px]">{c.dmcColor.name}</span>
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
        <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">
          Total: {schema.widthStitches * schema.heightStitches} puncte • {colors.length} culori DMC
        </p>
      </div>
    </div>
  )
}

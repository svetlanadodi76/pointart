import { Document, Page, Svg, Rect, Line, Text } from '@react-pdf/renderer'
import type { GeneratedSchema, CraftType, CanvasType } from '@/types'
import { getCategoricalColor, SOLID_THRESHOLD, SIMPLE_SYMBOLS } from '@/lib/dmc/categoricalColors'

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '#000000' : '#ffffff'
}

const PT_PER_CM = 28.3465

const STITCH_SIZE_CM: Record<string, number> = {
  '11CT':   1 / 4.3,
  '14CT':   1 / 5.5,
  '16CT':   1 / 6.3,
  '18CT':   1 / 7.1,
  '2.5mm':  0.25,
  '2.8mm':  0.28,
  '3.0mm':  0.30,
  '10mesh': 1 / 3.94,
  '12mesh': 1 / 4.72,
  '14mesh': 1 / 5.51,
  '18mesh': 1 / 7.09,
}

interface FabricPDFProps {
  schema: GeneratedSchema
  name?: string
  craftType: CraftType
  canvasType?: CanvasType
}

export function FabricPDF({ schema, craftType, canvasType = '14CT' }: FabricPDFProps) {
  const { grid, colors, widthStitches, heightStitches } = schema
  const isCrossStitch = craftType === 'cross_stitch'
  const isGoblene = craftType === 'goblene'
  const isDiamond = craftType === 'diamond'

  // Culori și simboluri după rang
  const colorMeta = (() => {
    const sorted = [...colors.entries()].sort((a, b) => b[1].count - a[1].count)
    const rankMap = new Map<number, { catColor: string; symbol: string; isSolid: boolean }>()
    sorted.forEach(([origIdx], rank) => rankMap.set(origIdx, {
      catColor: getCategoricalColor(rank),
      symbol: isCrossStitch
        ? (rank >= SOLID_THRESHOLD ? (SIMPLE_SYMBOLS[rank - SOLID_THRESHOLD] ?? '?') : '')
        : (SIMPLE_SYMBOLS[rank % SIMPLE_SYMBOLS.length] ?? '?'),
      isSolid: isCrossStitch ? rank < SOLID_THRESHOLD : false,
    }))
    return colors.map((c, i) => {
      const r = rankMap.get(i) ?? { catColor: '#cccccc', symbol: '', isSolid: false }
      return isGoblene ? { ...r, symbol: c.symbol || '', isSolid: false } : r
    })
  })()

  const cellCm = STITCH_SIZE_CM[canvasType] ?? 1 / 5.5
  const cellPt = cellCm * PT_PER_CM
  const fontSize = Math.max(cellPt * (isCrossStitch ? 0.72 : 0.68), 3)

  // Simboluri vizibile doar la celule suficient de mari (diamante ~7pt, 11CT ~6pt)
  const showSymbols = cellPt >= 4.5

  // Pagina = dimensiunea exactă a pânzei (1:1, fără scalare)
  const pageWidth = widthStitches * cellPt
  const pageHeight = heightStitches * cellPt

  // Rect-uri plate (fără G wrapper — reduce elementele la jumătate față de G+Rect)
  const cellRects = grid.flatMap((row, y) =>
    row.map((colorIdx, x) => {
      const color = colors[colorIdx]
      const meta = colorMeta[colorIdx]
      const fill = isCrossStitch
        ? (meta.isSolid ? meta.catColor : '#ffffff')
        : color.dmcColor.hex
      return (
        <Rect
          key={`r-${y}-${x}`}
          x={x * cellPt} y={y * cellPt}
          width={cellPt} height={cellPt}
          fill={fill}
        />
      )
    })
  )

  // Simboluri ca elemente separate (plate, nu în G)
  const cellTexts = showSymbols
    ? grid.flatMap((row, y) =>
        row.map((colorIdx, x) => {
          const color = colors[colorIdx]
          const meta = colorMeta[colorIdx]
          // Diamond: simbol pe toate celulele (negru/alb după contrast)
          // Cross-stitch: simbol doar pe culorile non-solid (rank >= SOLID_THRESHOLD)
          // Goblen: simbol pe toate
          const sym = isDiamond
            ? (color.symbol || meta.symbol)
            : isCrossStitch
              ? (meta.isSolid ? null : meta.symbol)
              : (color.symbol || meta.symbol)
          if (!sym) return null
          const symColor = isDiamond
            ? contrastColor(color.dmcColor.hex)
            : isCrossStitch
              ? meta.catColor
              : contrastColor(color.dmcColor.hex)
          return (
            <Text
              key={`t-${y}-${x}`}
              style={{ fontSize, fill: symColor, textAnchor: 'middle' }}
              x={x * cellPt + cellPt / 2}
              y={y * cellPt + cellPt * 0.75}
            >
              {sym}
            </Text>
          )
        }).filter(Boolean)
      )
    : []

  // Linii de orientare la fiecare 10 celule (fine nu se văd la imprimare mm-scale)
  const vertLines = Array.from({ length: Math.floor(widthStitches / 10) + 1 }, (_, i) => (
    <Line key={`v-${i}`}
      x1={i * 10 * cellPt} y1={0} x2={i * 10 * cellPt} y2={pageHeight}
      stroke="#000000" strokeWidth={0.5} opacity={0.5}
    />
  ))
  const horizLines = Array.from({ length: Math.floor(heightStitches / 10) + 1 }, (_, i) => (
    <Line key={`h-${i}`}
      x1={0} y1={i * 10 * cellPt} x2={pageWidth} y2={i * 10 * cellPt}
      stroke="#000000" strokeWidth={0.5} opacity={0.5}
    />
  ))

  return (
    <Document title="Tipărire pânză 1:1" author="PointArt">
      <Page size={[pageWidth, pageHeight]} style={{ padding: 0, margin: 0 }}>
        <Svg width={pageWidth} height={pageHeight} viewBox={`0 0 ${pageWidth} ${pageHeight}`}>
          {cellRects}
          {cellTexts}
          {vertLines}
          {horizLines}
          <Rect x={0} y={0} width={pageWidth} height={pageHeight} fill="none" stroke="#000000" strokeWidth={1} />
        </Svg>
      </Page>
    </Document>
  )
}

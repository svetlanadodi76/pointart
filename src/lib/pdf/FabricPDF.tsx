import { Document, Page, Svg, Rect, Line, G, Text } from '@react-pdf/renderer'
import type { GeneratedSchema, CraftType, CanvasType } from '@/types'
import { getCategoricalColor, SOLID_THRESHOLD, SIMPLE_SYMBOLS } from '@/lib/dmc/categoricalColors'

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '#000000' : '#ffffff'
}

// 1 cm = 28.3465 PDF points (standard PDF unit)
const PT_PER_CM = 28.3465

// Dimensiunea reală a unui punct/diamant pe pânză (cm/celulă)
const STITCH_SIZE_CM: Record<string, number> = {
  '11CT':  1 / 4.3,   // ~2.33mm
  '14CT':  1 / 5.5,   // ~1.82mm
  '16CT':  1 / 6.3,   // ~1.59mm
  '18CT':  1 / 7.1,   // ~1.41mm
  '2.5mm': 0.25,
  '2.8mm': 0.28,
  '3.0mm': 0.30,
}

interface FabricPDFProps {
  schema: GeneratedSchema
  name?: string
  craftType: CraftType
  canvasType?: CanvasType
}

export function FabricPDF({
  schema,
  name = 'Schema PointArt',
  craftType,
  canvasType = '14CT',
}: FabricPDFProps) {
  const { grid, colors, widthStitches, heightStitches, widthCm, heightCm } = schema
  const isCrossStitch = craftType === 'cross_stitch' || craftType === 'goblene'

  // Atribuie culori și simboluri după rang (identic cu SchemaPDF)
  const colorMeta = (() => {
    const sorted = [...colors.entries()].sort((a, b) => b[1].count - a[1].count)
    const rankMap = new Map<number, { catColor: string; symbol: string; isSolid: boolean }>()
    sorted.forEach(([origIdx], rank) => rankMap.set(origIdx, {
      catColor: getCategoricalColor(rank),
      symbol: rank >= SOLID_THRESHOLD ? (SIMPLE_SYMBOLS[rank - SOLID_THRESHOLD] ?? '?') : '',
      isSolid: rank < SOLID_THRESHOLD,
    }))
    return colors.map((_, i) => rankMap.get(i) ?? { catColor: '#cccccc', symbol: '', isSolid: false })
  })()

  // Dimensiunea unei celule în PDF points (= dimensiunea reală 1:1)
  const cellCm = STITCH_SIZE_CM[canvasType] ?? 1 / 5.5
  const cellPt = cellCm * PT_PER_CM

  // Pagina PDF are exact dimensiunea pânzei
  const pageWidth = widthStitches * cellPt
  const pageHeight = heightStitches * cellPt

  // Simboluri vizibile doar la celule mai mari (11CT și diamante)
  const showSymbol = cellPt >= 4.5
  const fontSize = Math.max(cellPt * (isCrossStitch ? 0.72 : 0.62), 3)

  return (
    <Document title={`${name} — Tipărire pânză`} author="PointArt">
      <Page size={[pageWidth, pageHeight]} style={{ padding: 0, margin: 0 }}>
        <Svg
          width={pageWidth}
          height={pageHeight}
          viewBox={`0 0 ${pageWidth} ${pageHeight}`}
        >
          {/* Celule colorate la scară reală */}
          {grid.map((row, y) =>
            row.map((colorIdx, x) => {
              const color = colors[colorIdx]
              const meta = colorMeta[colorIdx]
              const cx = x * cellPt
              const cy = y * cellPt
              const cellBg = isCrossStitch
                ? (meta.isSolid ? meta.catColor : '#ffffff')
                : color.dmcColor.hex
              const symbolFill = isCrossStitch ? meta.catColor : contrastColor(color.dmcColor.hex)
              const showSym = showSymbol && (!isCrossStitch || (!meta.isSolid && !!meta.symbol))
              return (
                <G key={`${y}-${x}`}>
                  <Rect
                    x={cx} y={cy}
                    width={cellPt} height={cellPt}
                    fill={cellBg}
                  />
                  {showSym && (
                    <Text
                      style={{ fontSize, fill: symbolFill, textAnchor: 'middle' }}
                      x={cx + cellPt / 2}
                      y={cy + cellPt * 0.75}
                    >
                      {isCrossStitch ? meta.symbol : color.symbol}
                    </Text>
                  )}
                </G>
              )
            })
          )}

          {/* Linii fine între celule */}
          {Array.from({ length: widthStitches + 1 }, (_, i) => {
            const x = i * cellPt
            const isTen = i % 10 === 0
            return (
              <Line key={`v-${i}`}
                x1={x} y1={0} x2={x} y2={pageHeight}
                stroke="#000000"
                strokeWidth={isTen ? 0.5 : 0.1}
                opacity={isTen ? 0.6 : 0.2}
              />
            )
          })}
          {Array.from({ length: heightStitches + 1 }, (_, i) => {
            const y = i * cellPt
            const isTen = i % 10 === 0
            return (
              <Line key={`h-${i}`}
                x1={0} y1={y} x2={pageWidth} y2={y}
                stroke="#000000"
                strokeWidth={isTen ? 0.5 : 0.1}
                opacity={isTen ? 0.6 : 0.2}
              />
            )
          })}

          {/* Bordură exterioară */}
          <Rect
            x={0} y={0}
            width={pageWidth} height={pageHeight}
            fill="none"
            stroke="#000000"
            strokeWidth={1}
          />
        </Svg>
      </Page>
    </Document>
  )
}

import { Document, Page, View, Svg, Rect, Line, Text } from '@react-pdf/renderer'
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

// Câte rânduri per chunk SVG — la 165 col × 20 rând = 3.300 elemente/SVG (vs 36k într-un singur SVG)
const ROWS_PER_CHUNK = 20

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
  const showSymbols = cellPt >= 4.5
  const fontSize = Math.max(cellPt * (isCrossStitch ? 0.72 : 0.68), 3)

  // Pagina = dimensiunea exactă a pânzei (1:1)
  const pageWidth = widthStitches * cellPt
  const pageHeight = heightStitches * cellPt

  // Chunk-uri de rânduri — fiecare chunk = un SVG separat (~3k elemente, nu 36k)
  const chunks: Array<{ startRow: number; endRow: number }> = []
  for (let r = 0; r < heightStitches; r += ROWS_PER_CHUNK) {
    chunks.push({ startRow: r, endRow: Math.min(r + ROWS_PER_CHUNK, heightStitches) })
  }

  return (
    <Document title="Tipărire pânză 1:1" author="PointArt">
      <Page size={[pageWidth, pageHeight]} style={{ padding: 0, position: 'relative' }}>

        {/* Chunk-uri de celule — fiecare ~3k elemente SVG în loc de 36k+ */}
        {chunks.map((chunk, chunkIdx) => {
          const chunkRows = chunk.endRow - chunk.startRow
          const chunkH = chunkRows * cellPt
          const chunkTop = chunk.startRow * cellPt

          return (
            <View
              key={chunkIdx}
              style={{ position: 'absolute', top: chunkTop, left: 0 }}
            >
              <Svg width={pageWidth} height={chunkH} viewBox={`0 0 ${pageWidth} ${chunkH}`}>
                {Array.from({ length: chunkRows }, (_, rowOffset) => {
                  const absRow = chunk.startRow + rowOffset
                  return grid[absRow].map((colorIdx, x) => {
                    const color = colors[colorIdx]
                    const meta = colorMeta[colorIdx]
                    const cx = x * cellPt
                    const cy = rowOffset * cellPt

                    const fill = isCrossStitch
                      ? (meta.isSolid ? meta.catColor : '#ffffff')
                      : color.dmcColor.hex

                    const sym = isDiamond
                      ? (color.symbol || meta.symbol)
                      : isCrossStitch
                        ? (meta.isSolid ? null : meta.symbol)
                        : (color.symbol || meta.symbol)

                    const symColor = isDiamond
                      ? contrastColor(color.dmcColor.hex)
                      : isCrossStitch
                        ? meta.catColor
                        : contrastColor(color.dmcColor.hex)

                    return [
                      <Rect key={`r-${absRow}-${x}`}
                        x={cx} y={cy} width={cellPt} height={cellPt} fill={fill}
                      />,
                      showSymbols && sym ? (
                        <Text key={`t-${absRow}-${x}`}
                          style={{ fontSize, fill: symColor, textAnchor: 'middle' }}
                          x={cx + cellPt / 2} y={cy + cellPt * 0.75}
                        >
                          {sym}
                        </Text>
                      ) : null,
                    ]
                  })
                })}
              </Svg>
            </View>
          )
        })}

        {/* Linii de orientare la fiecare 10 celule — SVG separat */}
        <View style={{ position: 'absolute', top: 0, left: 0 }}>
          <Svg width={pageWidth} height={pageHeight} viewBox={`0 0 ${pageWidth} ${pageHeight}`}>
            {Array.from({ length: Math.floor(widthStitches / 10) + 1 }, (_, i) => (
              <Line key={`v-${i}`}
                x1={i * 10 * cellPt} y1={0} x2={i * 10 * cellPt} y2={pageHeight}
                stroke="#000000" strokeWidth={0.5} opacity={0.4}
              />
            ))}
            {Array.from({ length: Math.floor(heightStitches / 10) + 1 }, (_, i) => (
              <Line key={`h-${i}`}
                x1={0} y1={i * 10 * cellPt} x2={pageWidth} y2={i * 10 * cellPt}
                stroke="#000000" strokeWidth={0.5} opacity={0.4}
              />
            ))}
            <Rect x={0} y={0} width={pageWidth} height={pageHeight}
              fill="none" stroke="#000000" strokeWidth={1}
            />
          </Svg>
        </View>

      </Page>
    </Document>
  )
}

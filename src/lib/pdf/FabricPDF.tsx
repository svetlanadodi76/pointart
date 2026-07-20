import { Document, Page, Svg, Rect, Line, Text, View } from '@react-pdf/renderer'
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

// A4 fără marjă — maximizăm zona utilă pentru 1:1
const PAGE_W = 595
const PAGE_H = 842

interface FabricPDFProps {
  schema: GeneratedSchema
  name?: string
  craftType: CraftType
  canvasType?: CanvasType
}

export function FabricPDF({ schema, name = 'PointArt', craftType, canvasType = '14CT' }: FabricPDFProps) {
  const { grid, colors, widthStitches, heightStitches, widthCm, heightCm } = schema
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

  // Celule per pagină A4 la scală 1:1 (fără marjă)
  const colsPerPage = Math.max(1, Math.floor(PAGE_W / cellPt))
  const rowsPerPage = Math.max(1, Math.floor(PAGE_H / cellPt))
  const pageCols = Math.ceil(widthStitches / colsPerPage)
  const pageRows = Math.ceil(heightStitches / rowsPerPage)

  const tiles: Array<{
    startRow: number; endRow: number
    startCol: number; endCol: number
    tileR: number; tileC: number
  }> = []
  for (let pr = 0; pr < pageRows; pr++) {
    for (let pc = 0; pc < pageCols; pc++) {
      tiles.push({
        startRow: pr * rowsPerPage,
        endRow: Math.min((pr + 1) * rowsPerPage, heightStitches),
        startCol: pc * colsPerPage,
        endCol: Math.min((pc + 1) * colsPerPage, widthStitches),
        tileR: pr, tileC: pc,
      })
    }
  }

  const totalTiles = tiles.length

  return (
    <Document title={`${name} — Tipărire 1:1`} author="PointArt">
      {tiles.map((tile, pageIdx) => {
        const secW = tile.endCol - tile.startCol
        const secH = tile.endRow - tile.startRow
        const svgW = secW * cellPt
        const svgH = secH * cellPt

        // Marcaje fiecare 10 celule — offset față de startCol/startRow
        const tenCols = Array.from({ length: Math.ceil(secW / 10) + 1 }, (_, i) => {
          const absCol = Math.ceil(tile.startCol / 10) * 10 + i * 10
          if (absCol < tile.startCol || absCol > tile.endCol) return null
          const x = (absCol - tile.startCol) * cellPt
          return (
            <Line key={`v-${i}`} x1={x} y1={0} x2={x} y2={svgH}
              stroke="#000" strokeWidth={0.6} opacity={0.5} />
          )
        })
        const tenRows = Array.from({ length: Math.ceil(secH / 10) + 1 }, (_, i) => {
          const absRow = Math.ceil(tile.startRow / 10) * 10 + i * 10
          if (absRow < tile.startRow || absRow > tile.endRow) return null
          const y = (absRow - tile.startRow) * cellPt
          return (
            <Line key={`h-${i}`} x1={0} y1={y} x2={svgW} y2={y}
              stroke="#000" strokeWidth={0.6} opacity={0.5} />
          )
        })

        return (
          <Page key={pageIdx} size="A4" style={{ padding: 0 }}>
            {/* Header minimal: număr pagină + coordonate secțiune */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 2 }}>
              <Text style={{ fontSize: 6, color: '#9ca3af' }}>
                {name} • {widthCm}×{heightCm} cm • {canvasType} • Tipărire 1:1 (printează la 100%, fără scalare)
              </Text>
              <Text style={{ fontSize: 6, color: '#9ca3af' }}>
                Secțiunea {tile.tileR + 1}-{tile.tileC + 1} / {pageRows}×{pageCols} • Pagina {pageIdx + 1}/{totalTiles}
              </Text>
            </View>

            <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
              {/* Celule */}
              {Array.from({ length: secH }, (_, rowOffset) =>
                Array.from({ length: secW }, (_, colOffset) => {
                  const absRow = tile.startRow + rowOffset
                  const absCol = tile.startCol + colOffset
                  const colorIdx = grid[absRow][absCol]
                  const color = colors[colorIdx]
                  const meta = colorMeta[colorIdx]
                  const cx = colOffset * cellPt
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
                    : isCrossStitch ? meta.catColor : contrastColor(color.dmcColor.hex)

                  return [
                    <Rect key={`r-${rowOffset}-${colOffset}`}
                      x={cx} y={cy} width={cellPt} height={cellPt} fill={fill}
                    />,
                    showSymbols && sym ? (
                      <Text key={`t-${rowOffset}-${colOffset}`}
                        style={{ fontSize, fill: symColor, textAnchor: 'middle' }}
                        x={cx + cellPt / 2} y={cy + cellPt * 0.75}
                      >
                        {sym}
                      </Text>
                    ) : null,
                  ]
                })
              )}

              {/* Linii la fiecare 10 celule */}
              {tenCols}
              {tenRows}

              {/* Bordură secțiune */}
              <Rect x={0} y={0} width={svgW} height={svgH}
                fill="none" stroke="#000" strokeWidth={0.8}
              />
            </Svg>
          </Page>
        )
      })}
    </Document>
  )
}

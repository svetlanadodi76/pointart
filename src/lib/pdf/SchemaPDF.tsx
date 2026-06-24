import {
  Document, Page, View, Text, Svg, Rect, Line, G,
  StyleSheet, Font
} from '@react-pdf/renderer'
import type { GeneratedSchema } from '@/types'

const PAGE_WIDTH = 595
const PAGE_HEIGHT = 842
const MARGIN = 30
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const LEGEND_HEIGHT = 240

const styles = StyleSheet.create({
  page: { backgroundColor: '#fff', padding: MARGIN },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#5b21b6' },
  subtitle: { fontSize: 9, color: '#6b7280', marginBottom: 8 },
  legendTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, marginTop: 10, color: '#111827' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendCode: { fontSize: 9, width: 50, color: '#111827', fontFamily: 'Courier' },
  legendName: { fontSize: 9, flex: 1, color: '#1f2937' },
  legendQty: { fontSize: 9, width: 60, color: '#111827', textAlign: 'right' },
  legendSymbol: { width: 16, height: 16, marginRight: 5, alignItems: 'center', justifyContent: 'center' },
  legendSymbolText: { fontSize: 10, textAlign: 'center' },
  pageNum: { fontSize: 7, color: '#9ca3af', textAlign: 'center', marginTop: 6 },
  rulerText: { fontSize: 5, fill: '#9ca3af' },
})

interface SchemaPDFProps {
  schema: GeneratedSchema
  name?: string
}

export function SchemaPDF({ schema, name = 'Schema PointArt' }: SchemaPDFProps) {
  const { grid, colors, widthStitches, heightStitches, widthCm, heightCm } = schema

  // Celulă fixă de 6px — suficient pentru simboluri vizibile, schema se împarte în pagini
  const availableWidth = CONTENT_WIDTH - 20
  const availableHeight = PAGE_HEIGHT - MARGIN * 2 - 60 - LEGEND_HEIGHT
  const cellSize = 6
  const fontSize = cellSize * 0.7

  // Câte rânduri/coloane încap pe o pagină la 6px/celulă
  const rowsPerPage = Math.floor(availableHeight / cellSize)
  const colsPerPage = Math.floor(availableWidth / cellSize)
  const pageRows = Math.ceil(heightStitches / rowsPerPage)
  const pageCols = Math.ceil(widthStitches / colsPerPage)

  const gridPages: Array<{ startRow: number; endRow: number; startCol: number; endCol: number }> = []
  for (let pr = 0; pr < pageRows; pr++) {
    for (let pc = 0; pc < pageCols; pc++) {
      gridPages.push({
        startRow: pr * rowsPerPage,
        endRow: Math.min((pr + 1) * rowsPerPage, heightStitches),
        startCol: pc * colsPerPage,
        endCol: Math.min((pc + 1) * colsPerPage, widthStitches),
      })
    }
  }

  // Sortează culorile după număr de puncte (descrescător)
  const sortedColors = [...colors].sort((a, b) => b.count - a.count)

  return (
    <Document title={name} author="PointArt">
      {/* Pagini cu grila */}
      {gridPages.map((section, pageIdx) => {
        const secWidth = section.endCol - section.startCol
        const secHeight = section.endRow - section.startRow
        const svgW = secWidth * cellSize + 20
        const svgH = secHeight * cellSize + 20

        return (
          <Page key={pageIdx} size="A4" style={styles.page}>
            {/* Header */}
            <Text style={styles.title}>{name}</Text>
            <Text style={styles.subtitle}>
              {widthStitches}×{heightStitches} puncte • {widthCm}×{heightCm} cm •{' '}
              {colors.length} culori DMC
              {pageRows > 1 || pageCols > 1
                ? ` • Secțiunea ${pageIdx + 1}/${gridPages.length}`
                : ''}
            </Text>

            {/* Grila SVG */}
            <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
              {/* Riglă sus */}
              {Array.from({ length: Math.floor(secWidth / 10) + 1 }, (_, i) => {
                const col = i * 10
                if (col > secWidth) return null
                return (
                  <G key={`ruler-top-${i}`}>
                    <Text
                      style={[styles.rulerText, { position: 'absolute' }]}
                      x={20 + col * cellSize}
                      y={8}
                    >
                      {section.startCol + col}
                    </Text>
                  </G>
                )
              })}

              {/* Riglă stânga */}
              {Array.from({ length: Math.floor(secHeight / 10) + 1 }, (_, i) => {
                const row = i * 10
                if (row > secHeight) return null
                return (
                  <Text
                    key={`ruler-left-${i}`}
                    style={[styles.rulerText, { position: 'absolute' }]}
                    x={0}
                    y={18 + row * cellSize}
                  >
                    {section.startRow + row}
                  </Text>
                )
              })}

              {/* Celule colorate cu simboluri */}
              {Array.from({ length: secHeight }, (_, rowIdx) =>
                Array.from({ length: secWidth }, (_, colIdx) => {
                  const colorIdx = grid[section.startRow + rowIdx][section.startCol + colIdx]
                  const color = colors[colorIdx]
                  const x = 20 + colIdx * cellSize
                  const y = 14 + rowIdx * cellSize

                  const isRulerH = (section.startRow + rowIdx) % 10 === 0
                  const isRulerV = (section.startCol + colIdx) % 10 === 0

                  return (
                    <G key={`${rowIdx}-${colIdx}`}>
                      <Rect
                        x={x} y={y}
                        width={cellSize} height={cellSize}
                        fill={color.dmcColor.hex}
                        stroke="#000000"
                        strokeWidth={0.35}
                      />
                      {cellSize >= 5 && (
                        <Text
                          style={{ fontSize, fill: '#000000cc', textAnchor: 'middle' }}
                          x={x + cellSize / 2}
                          y={y + cellSize * 0.75}
                        >
                          {color.symbol}
                        </Text>
                      )}
                    </G>
                  )
                })
              )}

              {/* Linii groase riglă 10x10 */}
              {Array.from({ length: Math.floor(secWidth / 10) + 1 }, (_, i) => {
                const x = 20 + i * 10 * cellSize
                return (
                  <Line key={`vline-${i}`}
                    x1={x} y1={14} x2={x} y2={14 + secHeight * cellSize}
                    stroke="#000000" strokeWidth={1.5}
                  />
                )
              })}
              {Array.from({ length: Math.floor(secHeight / 10) + 1 }, (_, i) => {
                const y = 14 + i * 10 * cellSize
                return (
                  <Line key={`hline-${i}`}
                    x1={20} y1={y} x2={20 + secWidth * cellSize} y2={y}
                    stroke="#000000" strokeWidth={1.5}
                  />
                )
              })}
            </Svg>

            {/* Legendă culori (doar pe prima pagină sau pe ultima) */}
            {pageIdx === 0 && (
              <View>
                <Text style={styles.legendTitle}>Culori folosite ({colors.length})</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {sortedColors.map((color, i) => (
                    <View key={i} style={[styles.legendRow, { width: '50%', paddingRight: 6 }]}>
                      <View style={[styles.legendSymbol, { backgroundColor: color.dmcColor.hex, borderWidth: 0.5, borderColor: '#ccc' }]}>
                        <Text style={styles.legendSymbolText}>{color.symbol}</Text>
                      </View>
                      <Text style={[styles.legendCode, { width: 42 }]}>DMC {color.dmcColor.code}</Text>
                      <Text style={[styles.legendQty, { width: 38, textAlign: 'left' }]}>
                        {color.skeins} {color.unit === 'packets' ? 'pach.' : 'scule'}
                      </Text>
                      <Text style={styles.legendName}>{color.dmcColor.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.pageNum}>
              PointArt.ro • {name} • Pagina {pageIdx + 1}/{gridPages.length}
            </Text>
          </Page>
        )
      })}
    </Document>
  )
}

import {
  Document, Page, View, Text, Svg, Rect, Line, G, Circle, Polygon, Path,
  StyleSheet, Font
} from '@react-pdf/renderer'
import type { GeneratedSchema, CraftType } from '@/types'
import { getCategoricalColor, SOLID_THRESHOLD, SIMPLE_SYMBOLS, GEOMETRIC_SYMBOLS } from '@/lib/dmc/categoricalColors'

function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? '#000000' : '#ffffff'
}

function renderGeometricShape(symbol: string, x: number, y: number, cs: number, color: string) {
  const cx = x + cs / 2
  const cy = y + cs / 2
  const r = Math.max(cs / 2 - 0.8, 1)
  const p = Math.max(cs * 0.15, 0.7)
  const sw = Math.max(cs * 0.12, 0.5)

  switch (symbol) {
    case '▲': return <Polygon points={`${x+p},${y+cs-p} ${x+cs-p},${y+cs-p} ${cx},${y+p}`} fill={color} />
    case '▼': return <Polygon points={`${x+p},${y+p} ${x+cs-p},${y+p} ${cx},${y+cs-p}`} fill={color} />
    case '◀': return <Polygon points={`${x+cs-p},${y+p} ${x+cs-p},${y+cs-p} ${x+p},${cy}`} fill={color} />
    case '▶': return <Polygon points={`${x+p},${y+p} ${x+p},${y+cs-p} ${x+cs-p},${cy}`} fill={color} />
    case '●': return <Circle cx={cx} cy={cy} r={r} fill={color} />
    case '○': return <Circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={sw} />
    case '■': return <Rect x={x+p} y={y+p} width={cs-p*2} height={cs-p*2} fill={color} />
    case '□': return <Rect x={x+p} y={y+p} width={cs-p*2} height={cs-p*2} fill="none" stroke={color} strokeWidth={sw} />
    case '◆': return <Polygon points={`${cx},${y+p} ${x+cs-p},${cy} ${cx},${y+cs-p} ${x+p},${cy}`} fill={color} />
    case '◇': return <Polygon points={`${cx},${y+p} ${x+cs-p},${cy} ${cx},${y+cs-p} ${x+p},${cy}`} fill="none" stroke={color} strokeWidth={sw} />
    case '◐': return <Path d={`M ${cx} ${cy-r} A ${r} ${r} 0 0 0 ${cx} ${cy+r} Z`} fill={color} />
    case '◑': return <Path d={`M ${cx} ${cy-r} A ${r} ${r} 0 0 1 ${cx} ${cy+r} Z`} fill={color} />
    case '◒': return <Path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 0 ${cx+r} ${cy} Z`} fill={color} />
    case '◓': return <Path d={`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy} Z`} fill={color} />
    case '▣': return (
      <G>
        <Rect x={x+p} y={y+p} width={cs-p*2} height={cs-p*2} fill="none" stroke={color} strokeWidth={sw} />
        <Rect x={x+p+sw+0.5} y={y+p+sw+0.5} width={cs-p*2-sw*2-1} height={cs-p*2-sw*2-1} fill={color} />
      </G>
    )
    case '▤': return (
      <G>
        <Rect x={x+p} y={y+p} width={cs-p*2} height={cs-p*2} fill="none" stroke={color} strokeWidth={sw} />
        {[0.3, 0.5, 0.7].map((t, i) => (
          <Line key={i} x1={x+p} y1={y+p+(cs-p*2)*t} x2={x+cs-p} y2={y+p+(cs-p*2)*t} stroke={color} strokeWidth={sw*0.8} />
        ))}
      </G>
    )
    default: return null
  }
}

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
  legendNum: { fontSize: 8, width: 16, color: '#9ca3af', textAlign: 'right', marginRight: 4 },
  legendCode: { fontSize: 9, width: 46, color: '#111827', fontFamily: 'Courier' },
  legendName: { fontSize: 9, flex: 1, color: '#1f2937' },
  legendQty: { fontSize: 9, width: 34, color: '#374151' },
  legendPct: { fontSize: 8, width: 30, color: '#6b7280', textAlign: 'right' },
  legendSymbol: { width: 16, height: 16, marginRight: 5, alignItems: 'center', justifyContent: 'center' },
  legendSymbolText: { fontSize: 10, textAlign: 'center' },
  pageNum: { fontSize: 7, color: '#9ca3af', textAlign: 'center', marginTop: 6 },
  rulerText: { fontSize: 5, fill: '#9ca3af' },
})

interface SchemaPDFProps {
  schema: GeneratedSchema
  name?: string
  craftType?: CraftType
}

export function SchemaPDF({ schema, name = 'Schema PointArt', craftType = 'cross_stitch' }: SchemaPDFProps) {
  const { grid, widthStitches, heightStitches, widthCm, heightCm } = schema
  const isCrossStitch = craftType === 'cross_stitch'
  const isGoblene = craftType === 'goblene'

  // Atribuie culori categorice după rang (cel mai popular → rank 0)
  const colors = (() => {
    const sorted = [...schema.colors.entries()].sort((a, b) => b[1].count - a[1].count)
    const rankMap = new Map<number, { catColor: string; symbol: string; isSolid: boolean }>()
    sorted.forEach(([origIdx], rank) => rankMap.set(origIdx, {
      catColor: getCategoricalColor(rank),
      symbol: rank >= SOLID_THRESHOLD ? (SIMPLE_SYMBOLS[rank - SOLID_THRESHOLD] ?? '?') : '',
      isSolid: rank < SOLID_THRESHOLD,
    }))
    return schema.colors.map((c, i) => ({
      ...c,
      catColor: rankMap.get(i)?.catColor ?? '#cccccc',
      symbol: rankMap.get(i)?.symbol ?? '',
      isSolid: rankMap.get(i)?.isSolid ?? false,
    }))
  })()

  // Celulă fixă de 6px — suficient pentru simboluri vizibile, schema se împarte în pagini
  const availableWidth = CONTENT_WIDTH - 20
  const availableHeight = PAGE_HEIGHT - MARGIN * 2 - 60 - LEGEND_HEIGHT
  const cellSize = 6
  const fontSize = cellSize * (isCrossStitch ? 0.88 : 0.7)

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

                  const cellBg = isGoblene
                    ? color.dmcColor.hex
                    : isCrossStitch
                    ? (color.isSolid ? color.catColor : '#ffffff')
                    : color.dmcColor.hex
                  const symbolColor = isCrossStitch ? color.catColor : contrastColor(color.dmcColor.hex)
                  return (
                    <G key={`${rowIdx}-${colIdx}`}>
                      <Rect
                        x={x} y={y}
                        width={cellSize} height={cellSize}
                        fill={cellBg}
                        stroke={isCrossStitch ? '#cccccc' : '#555555'}
                        strokeWidth={isCrossStitch ? 0.5 : 0.35}
                      />
                      {!isGoblene && cellSize >= 5 && (!isCrossStitch || !color.isSolid) && !!color.symbol && (
                        GEOMETRIC_SYMBOLS.has(color.symbol)
                          ? renderGeometricShape(color.symbol, x, y, cellSize, symbolColor)
                          : (
                            <Text
                              style={{ fontSize, fill: symbolColor, textAnchor: 'middle' }}
                              x={x + cellSize / 2}
                              y={y + cellSize * 0.75}
                            >
                              {color.symbol}
                            </Text>
                          )
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
                      <Text style={styles.legendNum}>{i + 1}</Text>
                      {isGoblene ? (
                        /* Goblen — pătrat colorat plin, fără simbol */
                        <View style={[styles.legendSymbol, { backgroundColor: color.dmcColor.hex, borderWidth: 0.5, borderColor: '#ccc' }]} />
                      ) : isCrossStitch && color.isSolid ? (
                        /* Culoare plină — fără simbol */
                        <View style={[styles.legendSymbol, { backgroundColor: color.catColor, borderWidth: 0.5, borderColor: '#ccc' }]} />
                      ) : isCrossStitch && GEOMETRIC_SYMBOLS.has(color.symbol) ? (
                        /* Formă geometrică — SVG în legendă */
                        <View style={[styles.legendSymbol, { backgroundColor: '#ffffff', borderWidth: 0.5, borderColor: '#ccc' }]}>
                          <Svg width={16} height={16} viewBox="0 0 16 16">
                            {renderGeometricShape(color.symbol, 0, 0, 16, color.catColor)}
                          </Svg>
                        </View>
                      ) : (
                        /* Simbol text (sau DMC pentru diamante) */
                        <View style={[styles.legendSymbol, { backgroundColor: isCrossStitch ? '#ffffff' : color.dmcColor.hex, borderWidth: 0.5, borderColor: '#ccc' }]}>
                          <Text style={[styles.legendSymbolText, { color: isCrossStitch ? color.catColor : contrastColor(color.dmcColor.hex) }]}>{color.symbol}</Text>
                        </View>
                      )}
                      {/* Pătrat mic cu culoarea reală DMC (doar pentru cross-stitch) */}
                      {isCrossStitch && (
                        <View style={{ width: 8, height: 16, backgroundColor: color.dmcColor.hex, borderWidth: 0.5, borderColor: '#ccc', marginRight: 3 }} />
                      )}
                      <Text style={styles.legendCode}>DMC {color.dmcColor.code}</Text>
                      <Text style={styles.legendQty}>
                        {color.skeins} {color.unit === 'packets' ? 'pach.' : 'scule'}
                      </Text>
                      <Text style={styles.legendPct}>{color.count} pct.</Text>
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

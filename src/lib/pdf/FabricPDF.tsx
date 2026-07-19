import { Document, Page, Svg, Rect, Line } from '@react-pdf/renderer'
import type { GeneratedSchema, CraftType, CanvasType } from '@/types'
import { getCategoricalColor, SOLID_THRESHOLD } from '@/lib/dmc/categoricalColors'

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

export function FabricPDF({
  schema,
  craftType,
  canvasType = '14CT',
}: FabricPDFProps) {
  const { grid, colors, widthStitches, heightStitches } = schema
  const isCrossStitch = craftType === 'cross_stitch'
  const isGoblene = craftType === 'goblene'

  // Culori categorice după rang (pentru cross-stitch)
  const colorMeta = (() => {
    const sorted = [...colors.entries()].sort((a, b) => b[1].count - a[1].count)
    const rankMap = new Map<number, { catColor: string; isSolid: boolean }>()
    sorted.forEach(([origIdx], rank) => rankMap.set(origIdx, {
      catColor: getCategoricalColor(rank),
      isSolid: rank < SOLID_THRESHOLD,
    }))
    return colors.map((_, i) => rankMap.get(i) ?? { catColor: '#cccccc', isSolid: false })
  })()

  const cellCm = STITCH_SIZE_CM[canvasType] ?? 1 / 5.5
  const cellPt = cellCm * PT_PER_CM

  // Pagina = dimensiunea exactă a pânzei (1:1)
  const pageWidth = widthStitches * cellPt
  const pageHeight = heightStitches * cellPt

  // Celule: un Rect per celulă, fără G wrapper, fără Text (la mm-scale simbolurile nu sunt vizibile)
  const cellRects = grid.flatMap((row, y) =>
    row.map((colorIdx, x) => {
      const color = colors[colorIdx]
      const meta = colorMeta[colorIdx]
      const fill = isCrossStitch
        ? (meta.isSolid ? meta.catColor : '#ffffff')
        : (isGoblene ? color.dmcColor.hex : color.dmcColor.hex)
      return (
        <Rect
          key={`${y}-${x}`}
          x={x * cellPt}
          y={y * cellPt}
          width={cellPt}
          height={cellPt}
          fill={fill}
        />
      )
    })
  )

  // Linii grilă: doar la fiecare 10 celule (liniile fine nu sunt vizibile la scara mm)
  const vertLines = Array.from({ length: Math.floor(widthStitches / 10) + 1 }, (_, i) => {
    const x = i * 10 * cellPt
    if (x > pageWidth) return null
    return <Line key={`v-${i}`} x1={x} y1={0} x2={x} y2={pageHeight} stroke="#000000" strokeWidth={0.5} opacity={0.5} />
  })
  const horizLines = Array.from({ length: Math.floor(heightStitches / 10) + 1 }, (_, i) => {
    const y = i * 10 * cellPt
    if (y > pageHeight) return null
    return <Line key={`h-${i}`} x1={0} y1={y} x2={pageWidth} y2={y} stroke="#000000" strokeWidth={0.5} opacity={0.5} />
  })

  return (
    <Document title="Tipărire pânză 1:1" author="PointArt">
      <Page size={[pageWidth, pageHeight]} style={{ padding: 0, margin: 0 }}>
        <Svg width={pageWidth} height={pageHeight} viewBox={`0 0 ${pageWidth} ${pageHeight}`}>
          {cellRects}
          {vertLines}
          {horizLines}
          <Rect x={0} y={0} width={pageWidth} height={pageHeight} fill="none" stroke="#000000" strokeWidth={1} />
        </Svg>
      </Page>
    </Document>
  )
}

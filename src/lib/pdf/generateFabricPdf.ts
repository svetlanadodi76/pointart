import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { GeneratedSchema, CraftType, CanvasType } from '@/types'
import { getCategoricalColor, SOLID_THRESHOLD, SIMPLE_SYMBOLS } from '@/lib/dmc/categoricalColors'

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

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ]
}

function contrastRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? [0, 0, 0] : [1, 1, 1]
}

// Encodează caracterul pentru WinAnsi (Helvetica în PDF)
// Returnează null dacă caracterul nu poate fi reprezentat
function encodeChar(ch: string): string | null {
  const code = ch.charCodeAt(0)
  // ASCII 32-126 + Latin-1 supplement 160-255 → WinAnsi
  if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) return ch
  return null
}

export async function generateFabricPdf(
  schema: GeneratedSchema,
  craftType: CraftType,
  canvasType: CanvasType = '14CT',
): Promise<Buffer> {
  const { grid, colors, widthStitches, heightStitches } = schema
  const isCrossStitch = craftType === 'cross_stitch'
  const isGoblene = craftType === 'goblene'
  const isDiamond = craftType === 'diamond'

  // Culori categorice după rang
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
  const fontSize = Math.max(cellPt * 0.65, 3)

  // Pagina = dimensiunea exactă a pânzei (pentru tipografie mare format)
  const pageWidth = widthStitches * cellPt
  const pageHeight = heightStitches * cellPt

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const page = pdfDoc.addPage([pageWidth, pageHeight])

  // Desenează celulele — pdf-lib: (0,0) = bottom-left, y crește în sus
  for (let row = 0; row < heightStitches; row++) {
    for (let col = 0; col < widthStitches; col++) {
      const colorIdx = grid[row][col]
      const color = colors[colorIdx]
      const meta = colorMeta[colorIdx]

      const px = col * cellPt
      // Inversăm axa Y: rândul 0 al schemei = sus în imagine = y mare în PDF
      const py = pageHeight - (row + 1) * cellPt

      // Culoare fundal celulă
      const fillHex = isCrossStitch
        ? (meta.isSolid ? meta.catColor : '#ffffff')
        : color.dmcColor.hex

      const [fr, fg, fb] = hexToRgb(fillHex)
      page.drawRectangle({ x: px, y: py, width: cellPt, height: cellPt, color: rgb(fr, fg, fb) })

      // Simbol
      if (showSymbols) {
        const rawSym = isDiamond
          ? (color.symbol || meta.symbol)
          : isCrossStitch
            ? (meta.isSolid ? '' : meta.symbol)
            : (color.symbol || meta.symbol)

        const sym = rawSym ? encodeChar(rawSym) : null
        if (sym) {
          const symHex = isDiamond
            ? (contrastRgb(color.dmcColor.hex)[0] === 0 ? '#000000' : '#ffffff')
            : isCrossStitch
              ? meta.catColor
              : (contrastRgb(color.dmcColor.hex)[0] === 0 ? '#000000' : '#ffffff')

          const [sr, sg, sb] = hexToRgb(symHex)

          // Centrare aproximativă a simbolului în celulă
          const textWidth = font.widthOfTextAtSize(sym, fontSize)
          const textX = px + (cellPt - textWidth) / 2
          const textY = py + cellPt * 0.2

          page.drawText(sym, { x: textX, y: textY, size: fontSize, font, color: rgb(sr, sg, sb) })
        }
      }
    }
  }

  // Linii de orientare la fiecare 10 celule
  const lineColor = rgb(0, 0, 0)
  for (let c = 0; c <= widthStitches; c += 10) {
    const x = c * cellPt
    page.drawLine({ start: { x, y: 0 }, end: { x, y: pageHeight }, thickness: 0.5, color: lineColor, opacity: 0.4 })
  }
  for (let r = 0; r <= heightStitches; r += 10) {
    const y = r * cellPt
    page.drawLine({ start: { x: 0, y }, end: { x: pageWidth, y }, thickness: 0.5, color: lineColor, opacity: 0.4 })
  }

  // Bordură exterioară
  page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, borderColor: rgb(0, 0, 0), borderWidth: 1 })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

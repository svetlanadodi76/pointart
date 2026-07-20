import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib'
import type { GeneratedSchema, CraftType, CanvasType } from '@/types'
import { getCategoricalColor, SOLID_THRESHOLD, SIMPLE_SYMBOLS } from '@/lib/dmc/categoricalColors'

const [PAGE_W, PAGE_H] = PageSizes.A4   // 595 × 842 pt
const MARGIN = 28
const HEADER_H = 36    // spațiu header per pagină grilă
const CELL_PT = 6      // 6px per celulă — identic cu SchemaPDF vechi
const LEGEND_COLS = 2  // 2 coloane în legendă

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ]
}

function contrastBW(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return 0.299 * r + 0.587 * g + 0.114 * b > 128 ? [0, 0, 0] : [1, 1, 1]
}

function encodeChar(ch: string): string | null {
  const code = ch.charCodeAt(0)
  if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) return ch
  return null
}

export async function generateSchemaPdf(
  schema: GeneratedSchema,
  craftType: CraftType,
  canvasType: CanvasType = '14CT',
  name = 'Schema PointArt',
): Promise<Buffer> {
  const { grid, colors, widthStitches, heightStitches, widthCm, heightCm } = schema
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

  const fontSize = CELL_PT * 0.85
  const rulerFont = 5

  // Zona grilă per pagină (sub header)
  const gridAreaW = PAGE_W - MARGIN * 2
  const gridAreaH = PAGE_H - MARGIN * 2 - HEADER_H
  const colsPerPage = Math.floor(gridAreaW / CELL_PT)
  const rowsPerPage = Math.floor(gridAreaH / CELL_PT)

  const pageCols = Math.ceil(widthStitches / colsPerPage)
  const pageRows = Math.ceil(heightStitches / rowsPerPage)

  const tiles: Array<{ startRow: number; endRow: number; startCol: number; endCol: number }> = []
  for (let pr = 0; pr < pageRows; pr++) {
    for (let pc = 0; pc < pageCols; pc++) {
      tiles.push({
        startRow: pr * rowsPerPage,
        endRow: Math.min((pr + 1) * rowsPerPage, heightStitches),
        startCol: pc * colsPerPage,
        endCol: Math.min((pc + 1) * colsPerPage, widthStitches),
      })
    }
  }

  const totalPages = tiles.length + 1  // +1 pagina legendă

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const black = rgb(0, 0, 0)
  const gray = rgb(0.6, 0.6, 0.6)
  const violet = rgb(0.36, 0.13, 0.84)   // #5b21b6
  const gridLine = rgb(0, 0, 0)

  // ─── Pagini grilă ───────────────────────────────────────────────────────────
  for (let ti = 0; ti < tiles.length; ti++) {
    const tile = tiles[ti]
    const page = pdfDoc.addPage(PageSizes.A4)
    const secW = tile.endCol - tile.startCol
    const secH = tile.endRow - tile.startRow

    // Header
    page.drawText(name, { x: MARGIN, y: PAGE_H - MARGIN - 10, size: 11, font: fontBold, color: violet })
    page.drawText(
      `${widthStitches}×${heightStitches} puncte • ${widthCm}×${heightCm} cm • ${canvasType} • Pagina ${ti + 1}/${totalPages}`,
      { x: MARGIN, y: PAGE_H - MARGIN - 22, size: 7, font, color: gray }
    )

    // Originea grilei în coordonate PDF (y inversat)
    const gridOriginX = MARGIN + 14  // 14pt pentru riglă stânga
    const gridOriginY = PAGE_H - MARGIN - HEADER_H - secH * CELL_PT

    // Celule
    for (let rowOff = 0; rowOff < secH; rowOff++) {
      const absRow = tile.startRow + rowOff
      for (let colOff = 0; colOff < secW; colOff++) {
        const absCol = tile.startCol + colOff
        const colorIdx = grid[absRow][absCol]
        const color = colors[colorIdx]
        const meta = colorMeta[colorIdx]

        const cx = gridOriginX + colOff * CELL_PT
        const cy = gridOriginY + (secH - rowOff - 1) * CELL_PT  // y inversat

        const fillHex = isCrossStitch ? (meta.isSolid ? meta.catColor : '#ffffff') : color.dmcColor.hex
        const [fr, fg, fb] = hexToRgb(fillHex)
        page.drawRectangle({ x: cx, y: cy, width: CELL_PT, height: CELL_PT, color: rgb(fr, fg, fb) })

        // Simbol
        const rawSym = isDiamond
          ? (color.symbol || meta.symbol)
          : isCrossStitch ? (meta.isSolid ? '' : meta.symbol)
          : (color.symbol || meta.symbol)
        const sym = rawSym ? encodeChar(rawSym) : null
        if (sym) {
          const symHex = isDiamond
            ? (contrastBW(color.dmcColor.hex)[0] === 0 ? '#000000' : '#ffffff')
            : isCrossStitch ? meta.catColor
            : (contrastBW(color.dmcColor.hex)[0] === 0 ? '#000000' : '#ffffff')
          const [sr, sg, sb] = hexToRgb(symHex)
          const tw = font.widthOfTextAtSize(sym, fontSize)
          page.drawText(sym, {
            x: cx + (CELL_PT - tw) / 2,
            y: cy + CELL_PT * 0.18,
            size: fontSize, font, color: rgb(sr, sg, sb),
          })
        }
      }
    }

    // Linii grilă + riglă
    for (let c = 0; c <= secW; c++) {
      const absCol = tile.startCol + c
      const x = gridOriginX + c * CELL_PT
      const isTen = absCol % 10 === 0
      page.drawLine({
        start: { x, y: gridOriginY },
        end: { x, y: gridOriginY + secH * CELL_PT },
        thickness: isTen ? 0.6 : 0.2,
        color: gridLine,
        opacity: isTen ? 0.5 : 0.15,
      })
      if (isTen && c > 0 && c < secW) {
        page.drawText(String(absCol), {
          x: x - font.widthOfTextAtSize(String(absCol), rulerFont) / 2,
          y: gridOriginY + secH * CELL_PT + 2,
          size: rulerFont, font, color: gray,
        })
      }
    }
    for (let r = 0; r <= secH; r++) {
      const absRow = tile.startRow + r
      const y = gridOriginY + (secH - r) * CELL_PT
      const isTen = absRow % 10 === 0
      page.drawLine({
        start: { x: gridOriginX, y },
        end: { x: gridOriginX + secW * CELL_PT, y },
        thickness: isTen ? 0.6 : 0.2,
        color: gridLine,
        opacity: isTen ? 0.5 : 0.15,
      })
      if (isTen && r > 0 && r < secH) {
        page.drawText(String(absRow), {
          x: gridOriginX - font.widthOfTextAtSize(String(absRow), rulerFont) - 2,
          y: y - rulerFont / 2,
          size: rulerFont, font, color: gray,
        })
      }
    }

    // Bordură grilă
    page.drawRectangle({
      x: gridOriginX, y: gridOriginY,
      width: secW * CELL_PT, height: secH * CELL_PT,
      borderColor: black, borderWidth: 0.8,
    })
  }

  // ─── Pagina legendă ──────────────────────────────────────────────────────────
  const legendPage = pdfDoc.addPage(PageSizes.A4)
  legendPage.drawText(name, { x: MARGIN, y: PAGE_H - MARGIN - 10, size: 11, font: fontBold, color: violet })
  legendPage.drawText(
    `Legendă culori • ${colors.length} culori DMC • Pagina ${totalPages}/${totalPages}`,
    { x: MARGIN, y: PAGE_H - MARGIN - 22, size: 7, font, color: gray }
  )

  // Sumar materiale
  const totalStitches = widthStitches * heightStitches
  legendPage.drawText(
    `${widthStitches}×${heightStitches} = ${totalStitches.toLocaleString('ro-RO')} puncte • ${widthCm}×${heightCm} cm • ${canvasType}`,
    { x: MARGIN, y: PAGE_H - MARGIN - 38, size: 8, font, color: black }
  )

  // Coloane legendă
  const sortedColors = [...colors.entries()].sort((a, b) => b[1].count - a[1].count)
  const colW = (PAGE_W - MARGIN * 2) / LEGEND_COLS
  const rowH = 18
  const legendStartY = PAGE_H - MARGIN - 58

  sortedColors.forEach(([origIdx, color], i) => {
    const col = i % LEGEND_COLS
    const row = Math.floor(i / LEGEND_COLS)
    const lx = MARGIN + col * colW
    const ly = legendStartY - row * rowH

    if (ly < MARGIN + rowH) return  // pagina e plină — legendă trunchiată la max

    const meta = colorMeta[origIdx]

    // Pătrat culoare (16×16)
    const [cr, cg, cb] = hexToRgb(color.dmcColor.hex)
    legendPage.drawRectangle({ x: lx, y: ly - 12, width: 14, height: 14, color: rgb(cr, cg, cb), borderColor: black, borderWidth: 0.4 })

    // Simbol în pătrat
    const rawSym = isDiamond ? (color.symbol || meta.symbol)
      : isCrossStitch ? (meta.isSolid ? '' : meta.symbol)
      : (color.symbol || meta.symbol)
    const sym = rawSym ? encodeChar(rawSym) : null
    if (sym) {
      const [sr, sg, sb] = isDiamond
        ? contrastBW(color.dmcColor.hex)
        : isCrossStitch ? hexToRgb(meta.catColor)
        : contrastBW(color.dmcColor.hex)
      legendPage.drawText(sym, { x: lx + 3, y: ly - 9, size: 8, font, color: rgb(sr, sg, sb) })
    }

    // Text: "DMC 310 Black — 110 pach. • 10990 pct."
    const qty = color.skeins
    const unit = color.unit === 'packets' ? 'pach.' : color.unit?.includes('wool') ? 'scule lână' : color.unit?.includes('silk') ? 'scule mătase' : color.unit?.includes('cotton') ? 'scule bumbac' : 'scule'
    const label = `DMC ${color.dmcColor.code}  ${color.dmcColor.name}`
    const qty2 = `${qty} ${unit} · ${color.count.toLocaleString('ro-RO')} pct.`

    legendPage.drawText(label, { x: lx + 18, y: ly - 6, size: 8, font: fontBold, color: black })
    legendPage.drawText(qty2, { x: lx + 18, y: ly - 14, size: 7, font, color: gray })
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

import sharp from 'sharp'
import { findNearestDmc, loadDmcColors, type DmcColor } from '@/lib/dmc/matching'
import { assignSymbols } from '@/lib/dmc/symbols'
import type { CraftType, CanvasType, GeneratedSchema, ColorUsage } from '@/types'

const CANVAS_CONFIG = {
  '11CT': { stitchesPerCm: 4.3, strands: 3 },
  '14CT': { stitchesPerCm: 5.5, strands: 2 },
  '16CT': { stitchesPerCm: 6.3, strands: 2 },
  '18CT': { stitchesPerCm: 7.1, strands: 1 },
}

// 1 sculă DMC = 8m = 800cm. Un punct consumă ~1.5cm de ață per fir (diagonala 14CT × 4 brațe + overhead)
const CM_PER_STITCH = 1.5
const METERS_PER_SKEIN = 800

function quantizeColor(r: number, g: number, b: number, factor = 24): [number, number, number] {
  return [
    Math.round(r / factor) * factor,
    Math.round(g / factor) * factor,
    Math.round(b / factor) * factor,
  ]
}

// Elimină pixeli izolați: dacă un punct nu are niciun vecin de aceeași culoare,
// îl înlocuiește cu culoarea majoritară din vecinii săi. Rulăm 2 pasuri.
function smoothIsolatedPixels(grid: number[][], passes = 2): number[][] {
  let current = grid.map(row => [...row])
  const H = current.length
  const W = current[0].length

  for (let pass = 0; pass < passes; pass++) {
    const next = current.map(row => [...row])
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const val = current[y][x]
        // 8 vecini (inclusiv diagonale) — mai conservator pe margini
        const neighbors: number[] = []
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dy === 0 && dx === 0) continue
            const ny = y + dy, nx = x + dx
            if (ny >= 0 && ny < H && nx >= 0 && nx < W) neighbors.push(current[ny][nx])
          }
        }
        const matchesAny = neighbors.some(n => n === val)
        if (!matchesAny) {
          // Înlocuiește doar cu vecinii ortogonali (nu diagonali) — mai natural
          const ortho = [
            y > 0 ? current[y-1][x] : null,
            y < H-1 ? current[y+1][x] : null,
            x > 0 ? current[y][x-1] : null,
            x < W-1 ? current[y][x+1] : null,
          ].filter(n => n !== null) as number[]
          const freq = new Map<number, number>()
          for (const n of ortho) freq.set(n, (freq.get(n) ?? 0) + 1)
          const best = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]
          next[y][x] = best
        }
      }
    }
    current = next
  }
  return current
}

function averageColors(colors: [number, number, number][]): [number, number, number] {
  const sum = colors.reduce(([ar, ag, ab], [r, g, b]) => [ar + r, ag + g, ab + b], [0, 0, 0])
  return [Math.round(sum[0] / colors.length), Math.round(sum[1] / colors.length), Math.round(sum[2] / colors.length)]
}

export async function generateSchema(
  imageBuffer: Buffer,
  settings: {
    craftType: CraftType
    canvasType: CanvasType
    widthCm: number
    heightCm: number
    maxColors: number
  }
): Promise<GeneratedSchema> {
  const config = CANVAS_CONFIG[settings.canvasType]
  const widthStitches = Math.round(settings.widthCm * config.stitchesPerCm)
  const heightStitches = Math.round(settings.heightCm * config.stitchesPerCm)

  // Redimensionează cu kernel lanczos3 (calitate maximă) + ușoară saturație
  const { data: pixels, info } = await sharp(imageBuffer)
    .resize(widthStitches, heightStitches, { fit: 'fill', kernel: 'lanczos3' })
    .modulate({ saturation: 1.15 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const dmcColors = await loadDmcColors()

  // Construiește harta de frecvențe a culorilor (cuantizate)
  const colorFreq = new Map<string, { count: number; pixels: [number, number, number][] }>()

  for (let i = 0; i < pixels.length; i += 3) {
    const [qr, qg, qb] = quantizeColor(pixels[i], pixels[i + 1], pixels[i + 2])
    const key = `${qr},${qg},${qb}`
    if (!colorFreq.has(key)) colorFreq.set(key, { count: 0, pixels: [] })
    const entry = colorFreq.get(key)!
    entry.count++
    entry.pixels.push([pixels[i], pixels[i + 1], pixels[i + 2]])
  }

  // Sortează după frecvență și ia top N culori
  const sortedColors = [...colorFreq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, settings.maxColors)

  // Pentru fiecare grup, calculează culoarea medie și găsește DMC-ul cel mai apropiat
  const colorGroups: Array<{ qKey: string; dmc: DmcColor; count: number }> = []
  const usedDmcCodes = new Set<string>()

  for (const [key, { count, pixels: groupPixels }] of sortedColors) {
    const [avgR, avgG, avgB] = averageColors(groupPixels)
    let dmc = findNearestDmc(avgR, avgG, avgB, dmcColors)

    // Evită duplicate de DMC
    if (usedDmcCodes.has(dmc.code)) {
      const remaining = dmcColors.filter(c => !usedDmcCodes.has(c.code))
      if (remaining.length > 0) {
        dmc = findNearestDmc(avgR, avgG, avgB, remaining)
      }
    }

    usedDmcCodes.add(dmc.code)
    colorGroups.push({ qKey: key, dmc, count })
  }

  // Construiește lookup: culoare cuantizată → index grup
  const colorToIndex = new Map<string, number>()
  for (let i = 0; i < colorGroups.length; i++) {
    colorToIndex.set(colorGroups[i].qKey, i)
  }

  // Construiește grila
  const grid: number[][] = []
  for (let y = 0; y < heightStitches; y++) {
    const row: number[] = []
    for (let x = 0; x < widthStitches; x++) {
      const pixelIdx = (y * widthStitches + x) * 3
      const [qr, qg, qb] = quantizeColor(pixels[pixelIdx], pixels[pixelIdx + 1], pixels[pixelIdx + 2])
      const key = `${qr},${qg},${qb}`

      // Găsește cel mai apropiat grup
      let colorIdx = colorToIndex.get(key)
      if (colorIdx === undefined) {
        // Culoare care nu e în top N — găsește cel mai apropiat grup
        let minDist = Infinity
        colorIdx = 0
        for (let i = 0; i < colorGroups.length; i++) {
          const dmc = colorGroups[i].dmc
          const dist = Math.abs(qr - dmc.r) + Math.abs(qg - dmc.g) + Math.abs(qb - dmc.b)
          if (dist < minDist) { minDist = dist; colorIdx = i }
        }
      }
      row.push(colorIdx)
    }
    grid.push(row)
  }

  // Smoothing adaptiv: mai puține pasuri la scheme mici (detalii fine = 1-2 pixeli)
  const minDim = Math.min(widthStitches, heightStitches)
  const smoothPasses = minDim < 80 ? 0 : minDim < 130 ? 1 : 2
  const smoothedGrid = smoothPasses > 0 ? smoothIsolatedPixels(grid, smoothPasses) : grid

  // Recalculează numărul real de puncte per culoare din grilă
  const stitchCounts = new Array(colorGroups.length).fill(0)
  for (const row of smoothedGrid) {
    for (const idx of row) stitchCounts[idx]++
  }

  // Asignează simboluri
  const symbols = assignSymbols(colorGroups.length)

  const colors: ColorUsage[] = colorGroups.map((group, i) => {
    let quantity: number
    let unit: 'skeins' | 'packets'

    if (settings.craftType === 'diamond') {
      // Diamante: 1 pachet ≈ 200 pietre, fiecare punct = 1 piatră
      quantity = Math.max(1, Math.ceil(stitchCounts[i] / 200))
      unit = 'packets'
    } else if (settings.craftType === 'goblene') {
      // Goblene: lână mai groasă, 1 skein ≈ 40m, ~6cm/punct, 1 fir
      quantity = Math.max(1, Math.ceil((stitchCounts[i] * 6) / 4000))
      unit = 'skeins'
    } else {
      // Broderie: DMC standard, 1 skein = 8m = 800cm
      quantity = Math.max(1, Math.ceil((stitchCounts[i] * config.strands * CM_PER_STITCH) / METERS_PER_SKEIN))
      unit = 'skeins'
    }

    return {
      dmcColor: group.dmc,
      symbol: symbols[i],
      count: stitchCounts[i],
      skeins: quantity,
      unit,
    }
  })

  return {
    grid: smoothedGrid,
    colors,
    widthStitches,
    heightStitches,
    widthCm: settings.widthCm,
    heightCm: settings.heightCm,
  }
}

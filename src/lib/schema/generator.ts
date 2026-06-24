import sharp from 'sharp'
import { findNearestDmc, loadDmcColors, type DmcColor } from '@/lib/dmc/matching'
import { assignSymbols } from '@/lib/dmc/symbols'
import type { CraftType, CanvasType, GeneratedSchema, ColorUsage } from '@/types'

const CANVAS_CONFIG = {
  '11CT': { stitchesPerCm: 4.3,   strands: 3 },
  '14CT': { stitchesPerCm: 5.5,   strands: 2 },
  '16CT': { stitchesPerCm: 6.3,   strands: 2 },
  '18CT': { stitchesPerCm: 7.1,   strands: 1 },
  // Diamante — densitate = 1 / (mm / 10)
  '2.5mm': { stitchesPerCm: 4.0,  strands: 0 },
  '2.8mm': { stitchesPerCm: 3.571, strands: 0 },
  '3.0mm': { stitchesPerCm: 3.333, strands: 0 },
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

  const minDim = Math.min(widthStitches, heightStitches)

  let finalGrid: number[][]

  if (minDim >= 80) {
    // Floyd-Steinberg dithering — gradiente fine, tranziții realiste
    // Buffer float pentru acumularea erorilor de culoare
    const buf = new Float32Array(widthStitches * heightStitches * 3)
    for (let i = 0; i < pixels.length; i++) buf[i] = pixels[i]

    finalGrid = Array.from({ length: heightStitches }, () => new Array(widthStitches).fill(0))

    for (let y = 0; y < heightStitches; y++) {
      for (let x = 0; x < widthStitches; x++) {
        const idx = (y * widthStitches + x) * 3
        const r = Math.max(0, Math.min(255, buf[idx]))
        const g = Math.max(0, Math.min(255, buf[idx + 1]))
        const b = Math.max(0, Math.min(255, buf[idx + 2]))

        // Cel mai apropiat DMC din paletă (distanță perceptuală)
        let minDist = Infinity
        let bestIdx = 0
        for (let i = 0; i < colorGroups.length; i++) {
          const dmc = colorGroups[i].dmc
          const dr = r - dmc.r, dg = g - dmc.g, db = b - dmc.b
          const dist = 2*dr*dr + 4*dg*dg + 3*db*db
          if (dist < minDist) { minDist = dist; bestIdx = i }
        }

        finalGrid[y][x] = bestIdx
        const chosen = colorGroups[bestIdx].dmc

        // Eroarea de cuantizare — clamp ±15 (cross-stitch = blocuri mari, nu zgomot pixel)
        const MAX_ERR = 15
        const er = Math.max(-MAX_ERR, Math.min(MAX_ERR, r - chosen.r))
        const eg = Math.max(-MAX_ERR, Math.min(MAX_ERR, g - chosen.g))
        const eb = Math.max(-MAX_ERR, Math.min(MAX_ERR, b - chosen.b))

        // Difuzare la 25% — tranziții subtile la margini, fără zgomot pe zone uniforme
        const DIFFUSE = 0.25
        const addErr = (nx: number, ny: number, f: number) => {
          if (nx < 0 || nx >= widthStitches || ny >= heightStitches) return
          const ni = (ny * widthStitches + nx) * 3
          buf[ni]     += er * f * DIFFUSE
          buf[ni + 1] += eg * f * DIFFUSE
          buf[ni + 2] += eb * f * DIFFUSE
        }
        addErr(x + 1, y,     7 / 16)
        addErr(x - 1, y + 1, 3 / 16)
        addErr(x,     y + 1, 5 / 16)
        addErr(x + 1, y + 1, 1 / 16)
      }
    }
  } else {
    // Scheme mici: nearest-neighbor simplu (dithering nu e vizibil la dimensiuni mici)
    finalGrid = []
    for (let y = 0; y < heightStitches; y++) {
      const row: number[] = []
      for (let x = 0; x < widthStitches; x++) {
        const pixelIdx = (y * widthStitches + x) * 3
        const [qr, qg, qb] = quantizeColor(pixels[pixelIdx], pixels[pixelIdx + 1], pixels[pixelIdx + 2])
        const key = `${qr},${qg},${qb}`
        let colorIdx = colorToIndex.get(key)
        if (colorIdx === undefined) {
          let minD = Infinity; colorIdx = 0
          for (let i = 0; i < colorGroups.length; i++) {
            const dmc = colorGroups[i].dmc
            const d = Math.abs(qr - dmc.r) + Math.abs(qg - dmc.g) + Math.abs(qb - dmc.b)
            if (d < minD) { minD = d; colorIdx = i }
          }
        }
        row.push(colorIdx)
      }
      finalGrid.push(row)
    }
    // Smoothing ușor doar pentru scheme mici (nearest-neighbor)
    if (minDim >= 50) finalGrid = smoothIsolatedPixels(finalGrid, 1)
  }

  // Recalculează numărul real de puncte per culoare
  const stitchCounts = new Array(colorGroups.length).fill(0)
  for (const row of finalGrid) {
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
    grid: finalGrid,
    colors,
    widthStitches,
    heightStitches,
    widthCm: settings.widthCm,
    heightCm: settings.heightCm,
  }
}

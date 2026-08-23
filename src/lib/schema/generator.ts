import { findNearestDmc, loadDmcColors, addLabToColors, findNearestByLab, type DmcColor, type DmcColorWithLab } from '@/lib/dmc/matching'
import { rgbToLab, ciede2000 } from '@/lib/dmc/colorSpace'
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
  // Goblen — mesh/inch ÷ 2.54
  '10mesh': { stitchesPerCm: 3.94, strands: 1 },
  '12mesh': { stitchesPerCm: 4.72, strands: 1 },
  '14mesh': { stitchesPerCm: 5.51, strands: 1 },
  '18mesh': { stitchesPerCm: 7.09, strands: 1 },
}

// 1 sculă DMC = 8m = 800cm cu 6 fire. La 14CT folosești 2 fire → 24m utilizabili/sculă.
// Un punct consumă ~1.5cm per fir (diagonala celulei × 4 brațe + overhead spate + nod)
const CM_PER_STITCH = 1.5
const CM_PER_SKEIN = 800 * 6  // 4800cm fir simplu per sculă (6 fire × 8m)

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

// Detectează tonuri calde (piele, inclusiv piele închisă/bronzată)
// Excluede: roșu/portocaliu intens (haine), gri, negru, albastru
function isSkinTone(r: number, g: number, b: number): boolean {
  return r > 60              // nu prea întunecat (umbră/păr)
    && r > g && g >= b       // direcție caldă: R > G ≥ B
    && (r - b) > 15          // separare clară față de gri/albastru
    && (r - b) < 160         // nu portocaliu intens (haine portocalii)
    && (r - g) < 90          // nu roșu viu (haine roșii)
}

function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  if (max === min) return 0
  const d = max - min
  let h = max === rn ? (gn - bn) / d + (gn < bn ? 6 : 0)
        : max === gn ? (bn - rn) / d + 2
                     : (rn - gn) / d + 4
  return h * 60
}

// ─── Profiluri de generare ────────────────────────────────────────────────────
// FACES: imagini cu fețe umane — piele netedă, gradiente fine, fără bonus cer
// NATURE: peisaje, flori, animale — blocuri curate, cer albastru protejat
// ─────────────────────────────────────────────────────────────────────────────
const FACES_PROFILE = {
  pipelineMode:      'faces' as const,
  qFactor:           32,
  maxErr:            15,
  diffuse:           0.18, // 0.15→0.18: tranziții mai fine între culorile de piele rezervate
  hueDiversityBonus: false,
  smoothPasses:      2,
  skinColorRatio:    0.35, // 35% din bugetul de culori rezervat tonurilor de piele
}

const NATURE_PROFILE = {
  pipelineMode:      'nature' as const,
  qFactor:           32,
  maxErr:            10,
  diffuse:           0.15,
  hueDiversityBonus: true,
  smoothPasses:      0,
  skinColorRatio:    0,    // peisaje: fără rezervare piele
}

function removeBackgroundFromGrid(grid: number[][], H: number, W: number): number[][] {
  // Detectează culoarea de fundal: cea mai frecventă la colțuri
  const corners = [grid[0][0], grid[0][W - 1], grid[H - 1][0], grid[H - 1][W - 1]]
  const freq = new Map<number, number>()
  for (const c of corners) freq.set(c, (freq.get(c) ?? 0) + 1)
  const bgIdx = [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0]

  // Flood-fill din toate colțurile cu culoarea de fundal
  const visited = Array.from({ length: H }, () => new Array(W).fill(false))
  const stack: [number, number][] = []
  for (const [cy, cx] of [[0, 0], [0, W - 1], [H - 1, 0], [H - 1, W - 1]] as [number, number][]) {
    if (grid[cy][cx] === bgIdx) stack.push([cy, cx])
  }
  while (stack.length > 0) {
    const [y, x] = stack.pop()!
    if (y < 0 || y >= H || x < 0 || x >= W || visited[y][x] || grid[y][x] !== bgIdx) continue
    visited[y][x] = true
    stack.push([y + 1, x], [y - 1, x], [y, x + 1], [y, x - 1])
  }

  // Celulele de fundal devin -1 (goale, nu se cos)
  const result = grid.map(row => [...row])
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (visited[y][x]) result[y][x] = -1
  return result
}

export async function generateSchema(
  imageBuffer: Buffer,
  settings: {
    craftType: CraftType
    canvasType: CanvasType
    widthCm: number
    heightCm: number
    maxColors: number
    hasFaces?: boolean               // true = fețe umane detectate → profil FACES
    imgBrightness?: number
    imgContrast?: number
    threadType?: 'wool' | 'silk' | 'cotton'
    imgSaturation?: number
    removeBackground?: boolean       // exclude fundalul conectat cu colțurile
  }
): Promise<GeneratedSchema> {
  const sharp = (await import('sharp')).default
  const config = CANVAS_CONFIG[settings.canvasType]
  const widthStitches = Math.round(settings.widthCm * config.stitchesPerCm)
  const heightStitches = Math.round(settings.heightCm * config.stitchesPerCm)

  // Selecție profil bazat pe CONȚINUT (fețe detectate), nu pe orientare (vertical/orizontal)
  const profile = settings.hasFaces ? FACES_PROFILE : NATURE_PROFILE

  // normalize pentru FACES dă deja contrast și saturație → satBoost 1.08 ca iulie 13
  const satBoost = 1.08
  const brightness = 1.0 * (settings.imgBrightness ?? 1.0)
  const saturation = satBoost * (settings.imgSaturation ?? 1.0)
  const contrast   = settings.imgContrast ?? 1.0

  // FACES: median(3) — kernel 7×7 pe full-res elimină textura de perete la scară mai mare
  //        (tencuială, gradienți de lumină) fără a afecta fețele (7px < 2.5% din lățimea feței)
  // NATURE: median(1) — kernel 3×3, suficient pentru reflexii speculare
  const pipeline = sharp(imageBuffer)
    .median(profile.pipelineMode === 'faces' ? 3 : 1)
    .resize(widthStitches, heightStitches, { fit: 'fill', kernel: 'lanczos3' })

  if (profile.pipelineMode === 'faces') {
    // fără blur post-resize: la schema ~165px, blur(0.8) distruge fețele mici (30-35px)
    // median(3) pe full-res + Lanczos3 resize sunt suficiente pentru pre-smoothing
    pipeline.normalize({ lower: 2, upper: 98 })
  } else {
    pipeline.gamma(1.3)
  }

  const { data: pixels } = await pipeline
    .modulate({ saturation, brightness })
    .linear(contrast, Math.round(128 * (1 - contrast)))
    .linear(1.0, 8)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  // Skin sat boost dezactivat: normalize per-canal cu zone foarte închise (pantaloni negri)
  // produce deja contrast ridicat pe piele → boost suplimentar = efect „portocaliu"

  const dmcColors = await loadDmcColors()
  // Precomputăm LAB o singură dată pentru toată paleta DMC (~500 culori)
  const dmcWithLab = addLabToColors(dmcColors)

  // Construiește harta de frecvențe a culorilor (cuantizate)
  const colorFreq = new Map<string, { count: number; pixels: [number, number, number][] }>()

  const qFactor = profile.qFactor

  for (let i = 0; i < pixels.length; i += 3) {
    const [qr, qg, qb] = quantizeColor(pixels[i], pixels[i + 1], pixels[i + 2], qFactor)
    const key = `${qr},${qg},${qb}`
    if (!colorFreq.has(key)) colorFreq.set(key, { count: 0, pixels: [] })
    const entry = colorFreq.get(key)!
    entry.count++
    entry.pixels.push([pixels[i], pixels[i + 1], pixels[i + 2]])
  }

  // Sortează după frecvență
  const allSorted = [...colorFreq.entries()].sort((a, b) => b[1].count - a[1].count)

  // Selecție culori cu rezervare piele pentru FACES
  // Fără rezervare, fundalul (cel mai frecvent) consumă 40-50% din buget → fețele primesc
  // prea puține nuanțe → tranziții dure, fețe neclare (mai ales portrete de grup)
  let sortedColors: typeof allSorted
  if (profile.skinColorRatio > 0) {
    const skinBudget  = Math.round(settings.maxColors * profile.skinColorRatio)
    const otherBudget = settings.maxColors - skinBudget

    const skinColors  = allSorted.filter(([k]) => { const [r,g,b] = k.split(',').map(Number); return isSkinTone(r,g,b) })
    const otherColors = allSorted.filter(([k]) => { const [r,g,b] = k.split(',').map(Number); return !isSkinTone(r,g,b) })

    sortedColors = [...skinColors.slice(0, skinBudget), ...otherColors.slice(0, otherBudget)]
  } else {
    sortedColors = allSorted.slice(0, settings.maxColors)
  }

  // Bonus diversitate ton — activ doar în profilul NATURE (profile.hueDiversityBonus)
  // Protejează culori cu ton distinct (cer albastru ~210°) care pierd competiția de
  // frecvență față de culorile dominante. Dezactivat pentru FACES: pielea e dominantă
  // și bonus-ul ar adăuga culori reci nepotrivite în fundalul portretelor.
  if (profile.hueDiversityBonus) {
    const selectedHues = sortedColors.map(([key]) => {
      const [r, g, b] = key.split(',').map(Number)
      return rgbToHue(r, g, b)
    })
    let bonusAdded = 0
    for (const [key, data] of allSorted.slice(settings.maxColors)) {
      if (bonusAdded >= 3) break
      const [r, g, b] = key.split(',').map(Number)
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
      // mn > 248: exclude doar aproape-alb pur — cerul palid/deschis e permis
      // mx - mn < 10: exclude griul neutru fără tentă de culoare
      if (mx < 30 || mn > 248 || mx - mn < 10) continue
      const hue = rgbToHue(r, g, b)
      const minHueDist = selectedHues.reduce((acc, sh) =>
        Math.min(acc, Math.min(Math.abs(hue - sh), 360 - Math.abs(hue - sh))), Infinity)
      if (minHueDist > 25) {
        sortedColors.push([key, data])
        selectedHues.push(hue)
        bonusAdded++
      }
    }
  }

  // Pentru fiecare grup, calculează culoarea medie și găsește DMC-ul cel mai apropiat
  const colorGroups: Array<{ qKey: string; dmc: DmcColor; count: number }> = []
  const usedDmcCodes = new Set<string>()

  for (const [key, { count, pixels: groupPixels }] of sortedColors) {
    const [avgR, avgG, avgB] = averageColors(groupPixels)
    let dmc = findNearestDmc(avgR, avgG, avgB, dmcWithLab)

    // Evită duplicate de DMC
    if (usedDmcCodes.has(dmc.code)) {
      const remaining = dmcWithLab.filter(c => !usedDmcCodes.has(c.code))
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

  // Precomputăm LAB pentru grupurile de culori active (subset din dmcWithLab)
  const groupsWithLab: DmcColorWithLab[] = colorGroups.map(g =>
    dmcWithLab.find(d => d.code === g.dmc.code) ?? { ...g.dmc, lab: rgbToLab(g.dmc.r, g.dmc.g, g.dmc.b) }
  )

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

        // CIEDE2000 — distanță perceptuală reală față de paleta DMC
        const [pL, pa, pb] = rgbToLab(r, g, b)
        const { idx: bestIdx } = findNearestByLab(pL, pa, pb, groupsWithLab)

        finalGrid[y][x] = bestIdx
        const chosen = colorGroups[bestIdx].dmc

        const MAX_ERR = profile.maxErr
        const er = Math.max(-MAX_ERR, Math.min(MAX_ERR, r - chosen.r))
        const eg = Math.max(-MAX_ERR, Math.min(MAX_ERR, g - chosen.g))
        const eb = Math.max(-MAX_ERR, Math.min(MAX_ERR, b - chosen.b))

        const DIFFUSE = profile.diffuse
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
    // smooth controlat de profil: FACES=1 pas (sigur — fără bonus albastru în paletă)
    // NATURE=0 pași (peisajele nu au nevoie, blocurile mari sunt deja uniforme)
    if (profile.smoothPasses > 0) finalGrid = smoothIsolatedPixels(finalGrid, profile.smoothPasses)
  } else {
    // Scheme mici: nearest-neighbor simplu (dithering nu e vizibil la dimensiuni mici)
    finalGrid = []
    for (let y = 0; y < heightStitches; y++) {
      const row: number[] = []
      for (let x = 0; x < widthStitches; x++) {
        const pixelIdx = (y * widthStitches + x) * 3
        const [qr, qg, qb] = quantizeColor(pixels[pixelIdx], pixels[pixelIdx + 1], pixels[pixelIdx + 2], qFactor)
        const key = `${qr},${qg},${qb}`
        let colorIdx = colorToIndex.get(key)
        if (colorIdx === undefined) {
          const [qL, qa, qb2] = rgbToLab(qr, qg, qb)
          colorIdx = findNearestByLab(qL, qa, qb2, groupsWithLab).idx
        }
        row.push(colorIdx)
      }
      finalGrid.push(row)
    }
    // Smoothing ușor doar pentru scheme mici (nearest-neighbor)
    if (minDim >= 50) finalGrid = smoothIsolatedPixels(finalGrid, 1)
  }

  // Excludere fundal (celulele conectate cu colțurile → -1)
  if (settings.removeBackground) {
    finalGrid = removeBackgroundFromGrid(finalGrid, heightStitches, widthStitches)
  }

  // Recalculează numărul real de puncte per culoare (sare celulele goale -1)
  const stitchCounts = new Array(colorGroups.length).fill(0)
  for (const row of finalGrid) {
    for (const idx of row) if (idx >= 0) stitchCounts[idx]++
  }

  // Elimină culorile sub prag: 0 puncte sau < 0.3% din total (min 2 puncte)
  const totalStitches = stitchCounts.reduce((a: number, b: number) => a + b, 0)
  const minStitches = Math.max(2, Math.floor(totalStitches * 0.003))
  const validMask = stitchCounts.map((c: number) => c >= minStitches)

  // Lucrăm pe copii mutabile ale array-urilor
  let activeGroups = [...colorGroups]
  let activeGroupsWithLab = [...groupsWithLab]
  let activeCounts = [...stitchCounts]

  if (validMask.some((v: boolean) => !v)) {
    // Mapare: index vechi → index nou în lista validelor
    const oldToNew = new Array(activeGroups.length).fill(-1)
    let ni = 0
    for (let i = 0; i < activeGroups.length; i++) if (validMask[i]) oldToNew[i] = ni++

    // Culorile invalide → nearest valid (CIEDE2000)
    const validWithLab = activeGroupsWithLab.filter((_, i) => validMask[i])
    for (let i = 0; i < activeGroups.length; i++) {
      if (validMask[i]) continue
      const [bL, ba, bb] = activeGroupsWithLab[i].lab
      oldToNew[i] = findNearestByLab(bL, ba, bb, validWithLab).idx
    }

    // Reindexează grid cu noile valori (sare celulele goale -1)
    for (let y = 0; y < finalGrid.length; y++)
      for (let x = 0; x < finalGrid[y].length; x++)
        if (finalGrid[y][x] >= 0) finalGrid[y][x] = oldToNew[finalGrid[y][x]]

    // Recalculează count-uri după remap
    const validCount = validMask.filter(Boolean).length
    const newCounts = new Array(validCount).fill(0)
    for (const row of finalGrid) for (const idx of row) newCounts[idx]++

    // Filtrează la culorile valide
    activeGroups = activeGroups.filter((_, i) => validMask[i])
    activeGroupsWithLab = activeGroupsWithLab.filter((_, i) => validMask[i])
    activeCounts = newCounts
  }

  // Asignează simboluri
  const symbols = assignSymbols(activeGroups.length)

  const colors: ColorUsage[] = activeGroups.map((group, i) => {
    const count = activeCounts[i]
    let quantity: number
    let unit: 'skeins' | 'packets' | 'wool_skeins' | 'silk_skeins' | 'cotton_skeins'

    if (settings.craftType === 'diamond') {
      quantity = Math.max(1, Math.ceil(count / 100))
      unit = 'packets'
    } else if (settings.craftType === 'goblene') {
      // Acoperire estimativă (puncte per sculă 8m) per tip ață × densitate mesh
      const coverage: Record<string, Record<string, number>> = {
        wool:   { '10mesh': 500, '12mesh': 600, '14mesh': 700, '18mesh': 900  },
        silk:   { '10mesh': 900, '12mesh': 1100,'14mesh': 1400,'18mesh': 1800 },
        cotton: { '10mesh': 700, '12mesh': 800, '14mesh': 900, '18mesh': 1200 },
      }
      const thread = settings.threadType ?? 'wool'
      const stitchesPerSkein = coverage[thread]?.[settings.canvasType] ?? 650
      quantity = Math.max(1, Math.ceil(count / stitchesPerSkein))
      unit = thread === 'silk' ? 'silk_skeins' : thread === 'cotton' ? 'cotton_skeins' : 'wool_skeins'
    } else {
      quantity = Math.max(1, Math.ceil((count * config.strands * CM_PER_STITCH) / CM_PER_SKEIN))
      unit = 'skeins'
    }

    return {
      dmcColor: group.dmc,
      symbol: symbols[i],
      count,
      skeins: quantity,
      unit,
    }
  })

  // Calculează alternative similare pentru fiecare culoare (top 8, din DMC-urile nefolosite)
  // dmcWithLab are LAB precomputat → fără overhead suplimentar
  const usedDmcSet = new Set(colors.map(c => c.dmcColor.code))
  const unusedDmc = dmcWithLab.filter(c => !usedDmcSet.has(c.code))

  for (const colorUsage of colors) {
    const [rL, ra, rb] = rgbToLab(colorUsage.dmcColor.r, colorUsage.dmcColor.g, colorUsage.dmcColor.b)
    colorUsage.alternatives = unusedDmc
      .map(c => {
        const [cL, ca, cb] = c.lab
        return { c, dist: ciede2000(rL, ra, rb, cL, ca, cb) }
      })
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 8)
      .map(({ c }) => c)
  }

  return {
    grid: finalGrid,
    colors,
    widthStitches,
    heightStitches,
    widthCm: settings.widthCm,
    heightCm: settings.heightCm,
  }
}

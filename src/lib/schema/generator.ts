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
// FACES_SINGLE: close-up (bebeluș, portret) — față = 60%+ din imagine
// FACES_GROUP:  portret de grup (cuplu, familie) — fețe mici, fundal complex
// NATURE:       peisaje, flori, animale
// ─────────────────────────────────────────────────────────────────────────────
const FACES_PROFILE = {
  pipelineMode:      'faces' as const,
  qFactor:           24,
  maxErr:            15,
  diffuse:           0.20,
  normLower:         2,
  normUpper:         98,
  hueDiversityBonus: false,
  smoothPasses:      0,
  skinColorRatio:    0,
}

// Portrete grup: fețe mai mici → stretch mai puțin agresiv (5/95 vs 2/98),
// diffuse mai mic (0.15 vs 0.20) pentru mai puțin portocaliu pe pielea bronzată
const FACES_GROUP_PROFILE = {
  pipelineMode:      'faces' as const,
  qFactor:           24,   // 20→24: blocuri mai curate pe rochie/haine (zone mari de culoare)
  maxErr:            12,
  diffuse:           0.10, // 0.15→0.10: mai puțin noise pe suprafețe uniforme (rochie, mâini)
  normLower:         5,
  normUpper:         95,
  hueDiversityBonus: false,
  smoothPasses:      0,
  skinColorRatio:    0,
}

const NATURE_PROFILE = {
  pipelineMode:      'nature' as const,
  qFactor:           32,
  maxErr:            10,
  diffuse:           0.15,
  normLower:         2,
  normUpper:         98,
  hueDiversityBonus: true,
  smoothPasses:      0,
  skinColorRatio:    0,
}

// Mini cross-stitch: miniaturi 2–5 cm pentru bijuterii handmade
// Schema mică → nearest-neighbor automat (< 80px pe latura mică)
// qFactor mare → mai puține grupuri de culoare → zone curate
// smoothPasses: 1 → forțat chiar și la dimensiuni sub 50px
const MINI_PROFILE = {
  pipelineMode:      'mini' as const,
  qFactor:           40,
  maxErr:            15,
  diffuse:           0,    // nu se aplică pe nearest-neighbor, dar 0 pentru claritate
  normLower:         2,
  normUpper:         98,
  hueDiversityBonus: true,  // asigură diversitate de culori la paleta mică (5–15 culori)
  smoothPasses:      1,     // esențial: curăță pixeli izolați la scară de 14–35 puncte
  skinColorRatio:    0,
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
    faceCount?: number               // numărul de fețe detectate (1=close-up, 2+=grup)
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

  // Selecție profil: mini_cross → MINI; fețe grup → FACES_GROUP; single → FACES; altfel NATURE
  const profile = settings.craftType === 'mini_cross'
    ? MINI_PROFILE
    : !settings.hasFaces
      ? NATURE_PROFILE
      : (settings.faceCount ?? 1) >= 2
        ? FACES_GROUP_PROFILE
        : FACES_PROFILE

  // normalize pentru FACES dă deja contrast și saturație → satBoost 1.08 ca iulie 13
  const satBoost = 1.08
  const brightness = 1.0 * (settings.imgBrightness ?? 1.0)
  const saturation = satBoost * (settings.imgSaturation ?? 1.0)
  const contrast   = settings.imgContrast ?? 1.0

  const isMini = settings.craftType === 'mini_cross'

  // Mini Cross — resize direct la dimensiunea finală + matching DMC per pixel
  // lanczos3 mediază culorile din fiecare celulă → funcționează atât pentru clipart smooth cât și pixel-art
  if (isMini) {
    const miniDmc = await loadDmcColors()
    const miniDmcWithLab = addLabToColors(miniDmc)

    // Detectează tipul imaginii: JPEG = fotografie pe pânzăa Aida, PNG/altele = clipart/schema
    // hasAlpha NU e fiabil (clipart poate fi PNG cu fundal alb fără canal alpha)
    const miniMeta = await sharp(imageBuffer).metadata()
    const isFabricPhoto = miniMeta.format === 'jpeg'

    const miniPipeline = sharp(imageBuffer)
      .flatten({ background: { r: 255, g: 255, b: 255 } })

    if (isFabricPhoto) {
      // Foto pe pânzăa Aida: fondul crem (R~240,G~230,B~215) → alb pur
      // Punctele de broderie → culori vii, matching DMC corect
      miniPipeline.modulate({ saturation: 2.0 }).linear(1.3, -35)
    }

    const { data: px } = await miniPipeline
      .trim({ background: '#ffffff', threshold: 15 })
      .resize(widthStitches, heightStitches, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 },
        // clipart: 'nearest' evită averaging — pixelii negri ai antenelor nu se amestecă cu roz
        // foto: 'lanczos3' — mai bun pentru tonuri continue
        kernel: isFabricPhoto ? 'lanczos3' : 'nearest',
      })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    // Matching DMC direct per pixel
    const dmcFreq = new Map<string, { dmc: DmcColor; count: number }>()
    const cellCodes: string[][] = []

    for (let y = 0; y < heightStitches; y++) {
      const row: string[] = []
      for (let x = 0; x < widthStitches; x++) {
        const i = (y * widthStitches + x) * 3
        const dmc = findNearestDmc(px[i], px[i + 1], px[i + 2], miniDmcWithLab)
        if (!dmcFreq.has(dmc.code)) dmcFreq.set(dmc.code, { dmc, count: 0 })
        dmcFreq.get(dmc.code)!.count++
        row.push(dmc.code)
      }
      cellCodes.push(row)
    }

    // Top maxColors după frecvență
    const topColors = [...dmcFreq.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, settings.maxColors)

    const codeToIdx = new Map<string, number>()
    topColors.forEach(({ dmc }, i) => codeToIdx.set(dmc.code, i))
    const topWithLab = topColors.map(({ dmc }) =>
      miniDmcWithLab.find(d => d.code === dmc.code) ?? { ...dmc, lab: rgbToLab(dmc.r, dmc.g, dmc.b) }
    )

    let miniGrid: number[][] = cellCodes.map(row =>
      row.map(code => {
        if (codeToIdx.has(code)) return codeToIdx.get(code)!
        const { dmc } = dmcFreq.get(code)!
        const [L, a, b] = rgbToLab(dmc.r, dmc.g, dmc.b)
        return findNearestByLab(L, a, b, topWithLab).idx
      })
    )

    // smooth doar pentru foto pe pânzăa Aida — clipart: linii subțiri (antene, contur)
    // sunt "izolate" și ar fi eliminate de smooth → lăsăm gridul exact cum e
    if (isFabricPhoto) miniGrid = smoothIsolatedPixels(miniGrid, 1)

    // Clipart PNG: fundal alb = padding din 'contain' → eliminat automat
    // Foto pânzăa Aida: eliminat doar dacă userul a activat opțiunea
    if (settings.removeBackground || !isFabricPhoto) {
      miniGrid = removeBackgroundFromGrid(miniGrid, heightStitches, widthStitches)
    }

    const miniCounts = new Array(topColors.length).fill(0)
    for (const row of miniGrid) for (const idx of row) if (idx >= 0) miniCounts[idx]++

    const miniTotal = miniCounts.reduce((a: number, b: number) => a + b, 0)
    const miniMin = Math.max(1, Math.floor(miniTotal * 0.003))
    const miniMask = miniCounts.map((c: number) => c >= miniMin)

    let activeColors = [...topColors]
    let activeWithLab = [...topWithLab]
    let activeCounts = [...miniCounts]

    if (miniMask.some((v: boolean) => !v)) {
      const oldToNew = new Array(activeColors.length).fill(-1)
      let ni = 0
      for (let i = 0; i < activeColors.length; i++) if (miniMask[i]) oldToNew[i] = ni++
      const validWithLab = activeWithLab.filter((_, i) => miniMask[i])
      for (let i = 0; i < activeColors.length; i++) {
        if (miniMask[i]) continue
        const [bL, ba, bb] = activeWithLab[i].lab
        oldToNew[i] = findNearestByLab(bL, ba, bb, validWithLab).idx
      }
      for (let y = 0; y < miniGrid.length; y++)
        for (let x = 0; x < miniGrid[y].length; x++)
          if (miniGrid[y][x] >= 0) miniGrid[y][x] = oldToNew[miniGrid[y][x]]
      const vc = miniMask.filter(Boolean).length
      const nc = new Array(vc).fill(0)
      for (const row of miniGrid) for (const idx of row) if (idx >= 0) nc[idx]++
      activeColors = activeColors.filter((_, i) => miniMask[i])
      activeWithLab = activeWithLab.filter((_, i) => miniMask[i])
      activeCounts = nc
    }

    const miniSymbols = assignSymbols(activeColors.length)
    const miniColors: ColorUsage[] = activeColors.map(({ dmc }, i) => ({
      dmcColor: dmc,
      symbol: miniSymbols[i],
      count: activeCounts[i],
      skeins: Math.max(1, Math.ceil((activeCounts[i] * config.strands * CM_PER_STITCH) / CM_PER_SKEIN)),
      unit: 'skeins' as const,
    }))

    const usedSet = new Set(miniColors.map(c => c.dmcColor.code))
    const unusedDmc = miniDmcWithLab.filter(c => !usedSet.has(c.code))
    for (const cu of miniColors) {
      const [rL, ra, rb] = rgbToLab(cu.dmcColor.r, cu.dmcColor.g, cu.dmcColor.b)
      cu.alternatives = unusedDmc
        .map(c => { const [cL, ca, cb] = c.lab; return { c, dist: ciede2000(rL, ra, rb, cL, ca, cb) } })
        .sort((a, b) => a.dist - b.dist).slice(0, 8).map(({ c }) => c)
    }

    return { grid: miniGrid, colors: miniColors, widthStitches, heightStitches, widthCm: settings.widthCm, heightCm: settings.heightCm }
  }

  const pipeline = sharp(imageBuffer)
    .flatten({ background: { r: 255, g: 255, b: 255 } })  // PNG transparent → fundal alb
    .median(1)  // kernel 3×3 — elimină reflexii speculare pe full-res

  pipeline.resize(widthStitches, heightStitches, {
    fit: 'fill',
    background: { r: 255, g: 255, b: 255 },
    kernel: 'lanczos3',
  })

  if (profile.pipelineMode === 'faces') {
    pipeline.normalize({ lower: profile.normLower, upper: profile.normUpper })
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
    if (minDim >= 50) {
      finalGrid = smoothIsolatedPixels(finalGrid, 1)
    }
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

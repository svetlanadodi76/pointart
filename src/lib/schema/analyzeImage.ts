export interface CanvasRecommendation {
  canvasType: string
  stitchesPerCm: number
  minWidthCm: number
  minHeightCm: number
  optimalColors: number
  isDiamond: boolean
  isGoblene: boolean
}

export interface AnalysisResult {
  complexityScore: number
  complexityLabel: string
  aspectRatio: number
  recommendations: CanvasRecommendation[]
  suggestedCanvas: string
  suggestedColors: number
  suggestedWidthCm: number
  suggestedHeightCm: number
  faceCount: number   // 0 = nicio față detectată, 1 = portret, 2+ = grup
}

const CANVAS_CONFIG = [
  { type: '11CT',   stitchesPerCm: 4.3,   isDiamond: false, isGoblene: false },
  { type: '14CT',   stitchesPerCm: 5.5,   isDiamond: false, isGoblene: false },
  { type: '16CT',   stitchesPerCm: 6.3,   isDiamond: false, isGoblene: false },
  { type: '18CT',   stitchesPerCm: 7.1,   isDiamond: false, isGoblene: false },
  { type: '2.5mm',  stitchesPerCm: 4.0,   isDiamond: true,  isGoblene: false },
  { type: '2.8mm',  stitchesPerCm: 3.571, isDiamond: true,  isGoblene: false },
  { type: '3.0mm',  stitchesPerCm: 3.333, isDiamond: true,  isGoblene: false },
  { type: '10mesh', stitchesPerCm: 3.94,  isDiamond: false, isGoblene: true  },
  { type: '12mesh', stitchesPerCm: 4.72,  isDiamond: false, isGoblene: true  },
  { type: '14mesh', stitchesPerCm: 5.51,  isDiamond: false, isGoblene: true  },
  { type: '18mesh', stitchesPerCm: 7.09,  isDiamond: false, isGoblene: true  },
]

export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  const sharp = (await import('sharp')).default

  const meta = await sharp(imageBuffer).metadata()
  // EXIF orientation 5-8 = rotit 90°/270° — swap dimensiuni pentru aspect ratio corect
  const swapDims = (meta.orientation ?? 1) >= 5
  const origW = swapDims ? (meta.height ?? 600) : (meta.width ?? 800)
  const origH = swapDims ? (meta.width ?? 800) : (meta.height ?? 600)
  const aspectRatio = origW / origH

  // Detectare margini via kernel Laplacian pe imagine greyscale redusă
  const { data: pixels, info } = await sharp(imageBuffer)
    .resize(200, 200, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const W = info.width
  const H = info.height
  let edgeSum = 0

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x
      const lap = Math.abs(
        -pixels[i - W - 1] - pixels[i - W] - pixels[i - W + 1]
        - pixels[i - 1] + 8 * pixels[i] - pixels[i + 1]
        - pixels[i + W - 1] - pixels[i + W] - pixels[i + W + 1]
      )
      edgeSum += lap
    }
  }

  const edgeMean = edgeSum / ((W - 2) * (H - 2))
  const edgeScore = Math.min(10, edgeMean / 18)

  // Diversitate culori pe imagine redusă la 100×100, cuantizată în pași de 32
  const { data: colorPixels } = await sharp(imageBuffer)
    .resize(100, 100, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const colorSet = new Set<string>()
  for (let i = 0; i < colorPixels.length; i += 3) {
    const r = Math.round(colorPixels[i]     / 32) * 32
    const g = Math.round(colorPixels[i + 1] / 32) * 32
    const b = Math.round(colorPixels[i + 2] / 32) * 32
    colorSet.add(`${r},${g},${b}`)
  }

  // Detecție fețe: profil orizontal skin-tone pe imaginea 100×100
  // Algoritmul Kovac pentru ton de piele în RGB
  const skinColumns = new Array(100).fill(0)
  for (let i = 0; i < colorPixels.length; i += 3) {
    const idx  = i / 3
    const col  = idx % 100
    const row  = Math.floor(idx / 100)
    if (row > 70) continue  // ignorăm zona de jos (corp, haine)
    const r = colorPixels[i], g = colorPixels[i + 1], b = colorPixels[i + 2]
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
    const isSkin = r > 95 && g > 40 && b > 20
      && mx - mn > 15 && r > g && r > b && Math.abs(r - g) > 15
    if (isSkin) skinColumns[col]++
  }
  // Netezim profilul și numărăm vârfuri (fiecare vârf = o persoană)
  const smoothed = skinColumns.map((_, i) => {
    const slice = skinColumns.slice(Math.max(0, i - 2), Math.min(100, i + 3))
    return slice.reduce((a, v) => a + v, 0) / slice.length
  })
  const maxVal = Math.max(...smoothed)
  const threshold = maxVal * 0.3
  let faceCount = 0
  let inPeak = false
  for (let i = 0; i < smoothed.length; i++) {
    if (smoothed[i] > threshold) { if (!inPeak) { faceCount++; inPeak = true } }
    else { inPeak = false }
  }
  faceCount = maxVal < 1 ? 0 : Math.min(8, faceCount)  // 0 dacă nu există deloc skin

  const colorScore = Math.min(10, colorSet.size / 14)

  // Scor combinat: 60% margini + 40% culori
  const raw = edgeScore * 0.6 + colorScore * 0.4
  const complexityScore = Math.round(raw * 10) / 10

  const complexityLabel =
    complexityScore >= 8 ? 'Foarte ridicată' :
    complexityScore >= 6 ? 'Ridicată' :
    complexityScore >= 4 ? 'Medie' :
    complexityScore >= 2 ? 'Redusă' : 'Simplă'

  // Portrete au nevoie de mai multe puncte pentru recunoaștere facială
  // Peisaje/flori arată bine și la densitate mai mică
  const isPortrait = aspectRatio < 1
  const portraitBoost = isPortrait ? 80 : 0

  // Scala separată portret vs peisaj — peisajele tolerează ~30% mai puține puncte
  const minStitchesShortBase = isPortrait
    ? (complexityScore >= 8 ? 320 : complexityScore >= 6 ? 250 : complexityScore >= 4 ? 190 : complexityScore >= 2 ? 150 : 110)
    : (complexityScore >= 8 ? 220 : complexityScore >= 6 ? 175 : complexityScore >= 4 ? 140 : complexityScore >= 2 ? 115 : 90)

  const minStitchesShort = minStitchesShortBase + portraitBoost

  // Culori optimale: 25 + scor × 5 (interval 25–75)
  const baseColors = Math.round(25 + complexityScore * 5)

  const recommendations: CanvasRecommendation[] = CANVAS_CONFIG.map(cfg => {
    const shortCm  = Math.ceil(minStitchesShort / cfg.stitchesPerCm)
    const longCm   = Math.ceil(shortCm * Math.max(aspectRatio, 1 / aspectRatio))

    const [minWidthCm, minHeightCm] = aspectRatio >= 1
      ? [longCm, shortCm]
      : [shortCm, longCm]

    // Ajustare culori față de densitatea pânzei (18CT permite mai multă detaliere)
    const densityFactor = cfg.stitchesPerCm / 5.5
    const optimalColors = Math.min(80, Math.round(baseColors * (0.85 + densityFactor * 0.15)))

    return { canvasType: cfg.type, stitchesPerCm: cfg.stitchesPerCm, minWidthCm, minHeightCm, optimalColors, isDiamond: cfg.isDiamond, isGoblene: cfg.isGoblene }
  })

  // Portret cu față detectată → 18CT (7.1 spc): +29% puncte față de 14CT → detalii mai clare
  const suggestedCanvas = faceCount >= 1 ? '18CT' : '14CT'
  const suggested = recommendations.find(r => r.canvasType === suggestedCanvas)!

  return {
    complexityScore,
    complexityLabel,
    aspectRatio,
    recommendations,
    suggestedCanvas,
    suggestedColors: suggested.optimalColors,
    suggestedWidthCm: suggested.minWidthCm,
    suggestedHeightCm: suggested.minHeightCm,
    faceCount,
  }
}

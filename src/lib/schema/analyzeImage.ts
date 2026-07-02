import sharp from 'sharp'

export interface CanvasRecommendation {
  canvasType: string
  stitchesPerCm: number
  minWidthCm: number
  minHeightCm: number
  optimalColors: number
  isDiamond: boolean
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
}

const CANVAS_CONFIG = [
  { type: '11CT', stitchesPerCm: 4.3,   isDiamond: false },
  { type: '14CT', stitchesPerCm: 5.5,   isDiamond: false },
  { type: '16CT', stitchesPerCm: 6.3,   isDiamond: false },
  { type: '18CT', stitchesPerCm: 7.1,   isDiamond: false },
  { type: '2.5mm', stitchesPerCm: 4.0,  isDiamond: true },
  { type: '2.8mm', stitchesPerCm: 3.571, isDiamond: true },
  { type: '3.0mm', stitchesPerCm: 3.333, isDiamond: true },
]

export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  const meta = await sharp(imageBuffer).metadata()
  const origW = meta.width ?? 800
  const origH = meta.height ?? 600
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

  const colorScore = Math.min(10, colorSet.size / 14)

  // Scor combinat: 60% margini + 40% culori
  const raw = edgeScore * 0.6 + colorScore * 0.4
  const complexityScore = Math.round(raw * 10) / 10

  const complexityLabel =
    complexityScore >= 8 ? 'Foarte ridicată' :
    complexityScore >= 6 ? 'Ridicată' :
    complexityScore >= 4 ? 'Medie' :
    complexityScore >= 2 ? 'Redusă' : 'Simplă'

  // Boost pentru portrete: pielea e uniformă (scor mic) dar fața are nevoie
  // de minim 200 puncte pentru recunoaștere facială corectă
  const isPortrait = aspectRatio < 1
  const portraitBoost = isPortrait ? 80 : 0

  // Număr minim de puncte pe latura scurtă în funcție de complexitate
  const minStitchesShortBase =
    complexityScore >= 8 ? 320 :
    complexityScore >= 6 ? 250 :
    complexityScore >= 4 ? 190 :
    complexityScore >= 2 ? 150 : 110

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

    return { canvasType: cfg.type, stitchesPerCm: cfg.stitchesPerCm, minWidthCm, minHeightCm, optimalColors, isDiamond: cfg.isDiamond }
  })

  const suggested = recommendations.find(r => r.canvasType === '14CT')!

  return {
    complexityScore,
    complexityLabel,
    aspectRatio,
    recommendations,
    suggestedCanvas: '14CT',
    suggestedColors: suggested.optimalColors,
    suggestedWidthCm: suggested.minWidthCm,
    suggestedHeightCm: suggested.minHeightCm,
  }
}

export interface PreprocessResult {
  buffer: Buffer
  steps: {
    upscaled: boolean
    faceEnhanced: boolean
    sharpened: boolean
  }
}

export async function aiPreprocess(imageBuffer: Buffer): Promise<PreprocessResult> {
  const Jimp = (await import('jimp')).default
  const steps = { upscaled: false, faceEnhanced: false, sharpened: false }

  if (!process.env.REPLICATE_API_TOKEN) {
    const img = await Jimp.read(imageBuffer)
    // Sharpen via unsharp-mask simplificat (convolve 3x3) + saturation boost
    img.convolute([
      [0, -0.5, 0],
      [-0.5, 3, -0.5],
      [0, -0.5, 0],
    ])
    const rgba = img.bitmap.data
    for (let i = 0; i < rgba.length; i += 4) {
      const r = rgba[i], g = rgba[i+1], b = rgba[i+2]
      const grey = 0.299 * r + 0.587 * g + 0.114 * b
      rgba[i]   = Math.max(0, Math.min(255, Math.round(grey + (r - grey) * 1.15)))
      rgba[i+1] = Math.max(0, Math.min(255, Math.round(grey + (g - grey) * 1.15)))
      rgba[i+2] = Math.max(0, Math.min(255, Math.round(grey + (b - grey) * 1.15)))
    }
    img.quality(82)
    const enhanced = Buffer.from(await img.getBufferAsync(Jimp.MIME_JPEG))
    return { buffer: enhanced, steps: { ...steps, sharpened: true } }
  }

  let buf = imageBuffer

  // Step 1: AI Upscaling — Real-ESRGAN (doar dacă < 1 megapixel)
  try {
    const probe = await Jimp.read(buf)
    const pixels = probe.getWidth() * probe.getHeight()
    if (pixels < 1_000_000 && pixels > 0) {
      const Replicate = (await import('replicate')).default
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
      const base64 = buf.toString('base64')
      const output = await Promise.race([
        replicate.run('nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b', {
          input: { image: `data:image/jpeg;base64,${base64}`, scale: 4, face_enhance: false },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 45000)),
      ]) as unknown as string
      const res = await fetch(output)
      buf = Buffer.from(await res.arrayBuffer())
      steps.upscaled = true
    }
  } catch (e) {
    console.error('[AI] upscale error:', e)
  }

  // Step 2: Face enhancement — GFPGAN (doar portrete: înălțime > lățime)
  try {
    const probe = await Jimp.read(buf)
    if (probe.getHeight() > probe.getWidth()) {
      const Replicate = (await import('replicate')).default
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
      const base64 = buf.toString('base64')
      const output = await Promise.race([
        replicate.run('tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3', {
          input: { img: `data:image/jpeg;base64,${base64}`, version: 'v1.4', scale: 1 },
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 45000)),
      ]) as unknown as string
      const res = await fetch(output)
      buf = Buffer.from(await res.arrayBuffer())
      steps.faceEnhanced = true
    }
  } catch (e) {
    console.error('[AI] face enhancement error:', e)
  }

  // Step 3: postprocessing final — Jimp auto-rotates EXIF, resize max 2500px, JPEG 82%
  try {
    const img = await Jimp.read(buf)
    const w = img.getWidth(), h = img.getHeight()
    if (w > 2500 || h > 2500) {
      img.scaleToFit(2500, 2500)
    }
    // Sharpen ușor + saturation boost
    img.convolute([
      [0, -0.5, 0],
      [-0.5, 3, -0.5],
      [0, -0.5, 0],
    ])
    const rgba = img.bitmap.data
    for (let i = 0; i < rgba.length; i += 4) {
      const r = rgba[i], g = rgba[i+1], b = rgba[i+2]
      const grey = 0.299 * r + 0.587 * g + 0.114 * b
      rgba[i]   = Math.max(0, Math.min(255, Math.round(grey + (r - grey) * 1.15)))
      rgba[i+1] = Math.max(0, Math.min(255, Math.round(grey + (g - grey) * 1.15)))
      rgba[i+2] = Math.max(0, Math.min(255, Math.round(grey + (b - grey) * 1.15)))
    }
    img.quality(82)
    buf = Buffer.from(await img.getBufferAsync(Jimp.MIME_JPEG))
    steps.sharpened = true
  } catch {
    // fallback: returnăm buf nemodificat
  }

  return { buffer: buf, steps }
}

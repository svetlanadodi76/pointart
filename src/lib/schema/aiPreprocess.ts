export interface PreprocessResult {
  buffer: Buffer
  steps: {
    upscaled: boolean
    faceEnhanced: boolean
    sharpened: boolean
  }
}

export async function aiPreprocess(imageBuffer: Buffer): Promise<PreprocessResult> {
  const sharp = (await import('sharp')).default
  const steps = { upscaled: false, faceEnhanced: false, sharpened: false }

  if (!process.env.REPLICATE_API_TOKEN) {
    const enhanced = await sharp(imageBuffer)
      .sharpen({ sigma: 1.2 })
      .modulate({ saturation: 1.15 })
      .toBuffer()
    return { buffer: enhanced, steps: { ...steps, sharpened: true } }
  }

  let buf = imageBuffer

  // Step 1: AI Upscaling — Real-ESRGAN (doar dacă < 1 megapixel)
  try {
    const meta = await sharp(buf).metadata()
    const pixels = (meta.width ?? 0) * (meta.height ?? 0)
    if (pixels < 1_000_000 && pixels > 0) {
      const Replicate = (await import('replicate')).default
      const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
      const base64 = buf.toString('base64')
      const mimeType = meta.format === 'png' ? 'image/png' : 'image/jpeg'
      const output = await Promise.race([
        replicate.run('nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b', {
          input: { image: `data:${mimeType};base64,${base64}`, scale: 4, face_enhance: false },
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
    const meta = await sharp(buf).metadata()
    if ((meta.height ?? 0) > (meta.width ?? 0)) {
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

  // Step 3: Sharp postprocessing final
  try {
    buf = await sharp(buf)
      .sharpen({ sigma: 1.2 })
      .median(1)
      .modulate({ saturation: 1.15 })
      .toBuffer()
    steps.sharpened = true
  } catch {
    // fallback
  }

  return { buffer: buf, steps }
}

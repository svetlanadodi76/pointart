import sharp from 'sharp'

export interface PreprocessResult {
  buffer: Buffer
  steps: {
    upscaled: boolean
    bgSimplified: boolean
    faceEnhanced: boolean
    sharpened: boolean
  }
}

export async function aiPreprocess(imageBuffer: Buffer): Promise<PreprocessResult> {
  const steps = { upscaled: false, bgSimplified: false, faceEnhanced: false, sharpened: false }

  if (!process.env.REPLICATE_API_TOKEN) {
    // Fără token → procesare Sharp locală (fără AI extern)
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
  } catch {
    // fallback — continuă cu bufferul anterior
  }

  // Step 2: Background simplification — RMBG (fundal blur + reducere saturație, nu eliminare)
  try {
    const Replicate = (await import('replicate')).default
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })
    const base64 = buf.toString('base64')
    const output = await Promise.race([
      replicate.run('lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1', {
        input: { image: `data:image/jpeg;base64,${base64}` },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000)),
    ]) as unknown as string

    // Descarcă masca, compozite pe fundal culoare pânză broderie
    const maskRes = await fetch(output)
    const maskBuf = Buffer.from(await maskRes.arrayBuffer())
    buf = await sharp(buf)
      .composite([{ input: maskBuf, blend: 'dest-in' }])
      .flatten({ background: '#F0EDE8' })
      .jpeg({ quality: 92 })
      .toBuffer()
    steps.bgSimplified = true
  } catch {
    // fallback
  }

  // Step 3: Face enhancement — GFPGAN (doar portrete: înălțime > lățime)
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
  } catch {
    // fallback
  }

  // Step 4: Sharp postprocessing final
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

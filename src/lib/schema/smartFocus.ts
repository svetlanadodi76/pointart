export interface SmartFocusResult {
  buffer: Buffer
  steps: {
    maskExtracted: boolean
    backgroundBlurred: boolean
  }
}

export async function smartFocus(imageBuffer: Buffer): Promise<SmartFocusResult> {
  const sharp = (await import('sharp')).default
  const steps = { maskExtracted: false, backgroundBlurred: false }

  // Fără token → returnează originalul nemodificat
  if (!process.env.REPLICATE_API_TOKEN) {
    return { buffer: imageBuffer, steps }
  }

  let subjectPng: Buffer | null = null

  // Step 1: RMBG-2.0 — detectare subiect + extragere mască
  try {
    const meta = await sharp(imageBuffer).metadata()
    const mimeType = meta.format === 'png' ? 'image/png' : 'image/jpeg'
    const base64 = imageBuffer.toString('base64')

    const Replicate = (await import('replicate')).default
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    const output = await Promise.race([
      replicate.run('briaai/rmbg-2.0', {
        input: { image: `data:${mimeType};base64,${base64}` },
      }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 60000)),
    ]) as unknown as string

    const res = await fetch(output)
    subjectPng = Buffer.from(await res.arrayBuffer())
    steps.maskExtracted = true
  } catch (e) {
    console.error('[SmartFocus] RMBG error:', e)
  }

  // Step 2: Composite — subiect original pe fundal neutru solid
  if (subjectPng) {
    try {
      const meta2 = await sharp(imageBuffer).metadata()
      const w = meta2.width!
      const h = meta2.height!

      // Fundal neutru solid (bej cald) — ocupă 1-2 culori în paletă în loc de 5-6
      const neutralBg = await sharp({
        create: { width: w, height: h, channels: 3, background: { r: 218, g: 212, b: 200 } },
      }).png().toBuffer()

      // Resize masca RMBG la dimensiunile originale (modelul poate returna altă rezoluție)
      const maskResized = await sharp(subjectPng)
        .resize(w, h, { fit: 'fill' })
        .toBuffer()

      // Aplică masca RMBG pe imaginea originală: blend 'dest-in' = pixeli originali × alpha mască
      // Rezultat: subiectul cu culorile originale exacte + background transparent
      const maskedSubject = await sharp(imageBuffer)
        .ensureAlpha()
        .composite([{ input: maskResized, blend: 'dest-in' }])
        .png()
        .toBuffer()

      // Composite subiect mascat peste fundal neutru
      const result = await sharp(neutralBg)
        .composite([{ input: maskedSubject, blend: 'over' }])
        .flatten({ background: '#ffffff' })
        .median(2)
        .jpeg({ quality: 85 })
        .toBuffer()

      steps.backgroundBlurred = true
      return { buffer: result, steps }
    } catch (e) {
      console.error('[SmartFocus] composite error:', e)
    }
  }

  // Fallback: returnează originalul dacă orice pas a eșuat
  return { buffer: imageBuffer, steps }
}

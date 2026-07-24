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

  // Step 2: Composite — subiect original pe fundal blurat/desaturat
  if (subjectPng) {
    try {
      // Fundal: blur puternic + culori reduse la jumătate
      const blurredBg = await sharp(imageBuffer)
        .blur(7)
        .modulate({ saturation: 0.4 })
        .toBuffer()

      // Composite: subiect (RGBA de la RMBG) peste fundal blurat
      // blend 'over' → unde subjectPng e opac, apare subiectul; unde e transparent → fundalul blurat
      const result = await sharp(blurredBg)
        .composite([{ input: subjectPng, blend: 'over' }])
        .flatten({ background: '#ffffff' })   // elimină canalul alpha → JPEG compatibil
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

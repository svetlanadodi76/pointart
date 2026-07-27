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

  if (!process.env.REMOVE_BG_API_KEY) {
    return { buffer: imageBuffer, steps }
  }

  let subjectPng: Buffer | null = null

  // Step 1: remove.bg API — elimină fundalul, returnează PNG cu alpha transparent
  try {
    const meta = await sharp(imageBuffer).metadata()
    const mimeType = meta.format === 'png' ? 'image/png' : 'image/jpeg'

    const formData = new FormData()
    formData.append('image_file', new Blob([new Uint8Array(imageBuffer)], { type: mimeType }), 'image.jpg')
    formData.append('size', 'full')

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
      body: formData,
    })

    if (!res.ok) throw new Error(`remove.bg ${res.status}: ${await res.text()}`)
    subjectPng = Buffer.from(await res.arrayBuffer())
    steps.maskExtracted = true
  } catch (e) {
    console.error('[SmartFocus] remove.bg error:', e)
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

      // Resize masca RMBG la dimensiunile exacte ale imaginii originale
      const maskResized = await sharp(subjectPng)
        .resize(w, h, { fit: 'fill' })
        .toBuffer()

      const maskMeta = await sharp(maskResized).metadata()
      console.error('[SmartFocus] mask meta:', JSON.stringify({
        format: maskMeta.format, width: maskMeta.width, height: maskMeta.height,
        channels: maskMeta.channels, hasAlpha: maskMeta.hasAlpha, origW: w, origH: h,
      }))

      // Extrage alpha din masca RMBG (single channel raw)
      // Dacă RMBG returnează PNG fără alpha → folosim greyscale negat (alb=fundal→0, subiect→>0)
      const alphaRaw = maskMeta.hasAlpha
        ? await sharp(maskResized).extractChannel('alpha').raw().toBuffer()
        : await sharp(maskResized).greyscale().negate().raw().toBuffer()

      // Extrage RGB original (raw, 3 canale)
      const origRaw = await sharp(imageBuffer)
        .resize(w, h, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer()

      // Construiește manual RGBA: culori originale + alpha din maska RMBG
      const rgbaData = Buffer.allocUnsafe(w * h * 4)
      for (let i = 0; i < w * h; i++) {
        rgbaData[i * 4]     = origRaw[i * 3]
        rgbaData[i * 4 + 1] = origRaw[i * 3 + 1]
        rgbaData[i * 4 + 2] = origRaw[i * 3 + 2]
        rgbaData[i * 4 + 3] = alphaRaw[i]
      }

      const maskedSubject = await sharp(rgbaData, { raw: { width: w, height: h, channels: 4 } })
        .png()
        .toBuffer()

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

  return { buffer: imageBuffer, steps }
}

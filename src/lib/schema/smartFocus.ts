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

      // Resize masca remove.bg la dimensiunile exacte ale imaginii originale
      const maskResized = await sharp(subjectPng)
        .resize(w, h, { fit: 'fill' })
        .toBuffer()

      const maskMeta = await sharp(maskResized).metadata()

      // Extrage alpha din masca remove.bg (single channel raw)
      const alphaRaw = maskMeta.hasAlpha
        ? await sharp(maskResized).extractChannel('alpha').raw().toBuffer()
        : await sharp(maskResized).greyscale().negate().raw().toBuffer()

      // Fundal blurat + desaturat (mai puțin zgomot de culori în schemă)
      const blurredBg = await sharp(imageBuffer)
        .blur(45)
        .modulate({ saturation: 0.15 })
        .raw()
        .toBuffer()

      // Construiește RGBA: subiect original unde masca e opacă, fundal blurat unde e transparentă
      const origRaw = await sharp(imageBuffer).removeAlpha().raw().toBuffer()
      const rgbaData = Buffer.allocUnsafe(w * h * 4)
      for (let i = 0; i < w * h; i++) {
        const a = alphaRaw[i]
        // Blend între subiect original și fundal blurat în funcție de alpha mască
        rgbaData[i * 4]     = Math.round((origRaw[i * 3]     * a + blurredBg[i * 3]     * (255 - a)) / 255)
        rgbaData[i * 4 + 1] = Math.round((origRaw[i * 3 + 1] * a + blurredBg[i * 3 + 1] * (255 - a)) / 255)
        rgbaData[i * 4 + 2] = Math.round((origRaw[i * 3 + 2] * a + blurredBg[i * 3 + 2] * (255 - a)) / 255)
        rgbaData[i * 4 + 3] = 255
      }

      const result = await sharp(rgbaData, { raw: { width: w, height: h, channels: 4 } })
        .jpeg({ quality: 90 })
        .toBuffer()

      steps.backgroundBlurred = true
      return { buffer: result, steps }
    } catch (e) {
      console.error('[SmartFocus] composite error:', e)
    }
  }

  return { buffer: imageBuffer, steps }
}

export interface SmartFocusResult {
  buffer: Buffer
  steps: {
    maskExtracted: boolean
    backgroundBlurred: boolean
  }
}

export async function smartFocus(imageBuffer: Buffer): Promise<SmartFocusResult> {
  const Jimp = (await import('jimp')).default
  const steps = { maskExtracted: false, backgroundBlurred: false }

  if (!process.env.REMOVE_BG_API_KEY) {
    return { buffer: imageBuffer, steps }
  }

  let subjectPng: Buffer | null = null

  // Step 1: remove.bg API — elimină fundalul, returnează PNG cu alpha transparent
  try {
    const formData = new FormData()
    formData.append('image_file', new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' }), 'image.jpg')
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

  // Step 2: Composite — subiect original pe fundal blurat + desaturat
  if (subjectPng) {
    try {
      const original = await Jimp.read(imageBuffer)
      const w = original.getWidth(), h = original.getHeight()

      // Resize masca remove.bg la dimensiunile exacte ale originalului
      const mask = await Jimp.read(subjectPng)
      mask.resize(w, h)
      const maskRgba = mask.bitmap.data

      // Extrage alpha din mască (PNG remove.bg are canal alpha)
      const alphaRaw = new Uint8Array(w * h)
      for (let i = 0; i < w * h; i++) alphaRaw[i] = maskRgba[i * 4 + 3]

      // Fundal blurat + desaturat (saturation 0.15 = 85% desaturat)
      const bg = original.clone().blur(20)  // blur mai mic față de Sharp (performanță JS)
      const bgRgba = bg.bitmap.data
      for (let i = 0; i < w * h; i++) {
        const r = bgRgba[i*4], g = bgRgba[i*4+1], b = bgRgba[i*4+2]
        const grey = 0.299 * r + 0.587 * g + 0.114 * b
        bgRgba[i*4]   = Math.round(grey + (r - grey) * 0.15)
        bgRgba[i*4+1] = Math.round(grey + (g - grey) * 0.15)
        bgRgba[i*4+2] = Math.round(grey + (b - grey) * 0.15)
      }

      // Blend: subiect original pe foreground, fundal blurat pe background
      const origRgba = original.bitmap.data
      const result = new (Jimp as any)(w, h, 0xffffffff)
      const resultData = result.bitmap.data
      for (let i = 0; i < w * h; i++) {
        const a = alphaRaw[i]
        resultData[i*4]   = Math.round((origRgba[i*4]   * a + bgRgba[i*4]   * (255 - a)) / 255)
        resultData[i*4+1] = Math.round((origRgba[i*4+1] * a + bgRgba[i*4+1] * (255 - a)) / 255)
        resultData[i*4+2] = Math.round((origRgba[i*4+2] * a + bgRgba[i*4+2] * (255 - a)) / 255)
        resultData[i*4+3] = 255
      }

      result.quality(90)
      const buf = Buffer.from(await result.getBufferAsync(Jimp.MIME_JPEG))
      steps.backgroundBlurred = true
      return { buffer: buf, steps }
    } catch (e) {
      console.error('[SmartFocus] composite error:', e)
    }
  }

  return { buffer: imageBuffer, steps }
}

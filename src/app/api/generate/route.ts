import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { generateSchema } from '@/lib/schema/generator'
import { logSecurity } from '@/lib/supabase/logSecurity'
import type { CraftType, CanvasType } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })
  }

  // Verifică și auto-expiră abonamentul dacă e cazul
  const subscription = await getSubscription(supabase, user.id)

  if (!subscription || subscription.status !== 'active') {
    await logSecurity('generation_blocked', user.email ?? user.id, `plan=${subscription?.plan ?? 'none'} status=${subscription?.status ?? 'none'}`)
    return NextResponse.json({ error: 'Abonament inactiv sau expirat' }, { status: 403 })
  }

  // Verifică limita de scheme (trial și starter)
  if (subscription.plan !== 'pro' && (subscription.schemas_remaining ?? 0) <= 0) {
    await logSecurity('generation_blocked', user.email ?? user.id, `plan=${subscription.plan} schemas_remaining=0`)
    return NextResponse.json({ error: 'Limita de scheme depășită' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    const craftType = formData.get('craftType') as CraftType
    const canvasType = formData.get('canvasType') as CanvasType
    const widthCm = parseFloat(formData.get('widthCm') as string)
    const heightCm = parseFloat(formData.get('heightCm') as string)
    const maxColors = parseInt(formData.get('maxColors') as string)
    const imgBrightness = parseFloat(formData.get('imgBrightness') as string) || 1.0
    const imgContrast = parseFloat(formData.get('imgContrast') as string) || 1.0
    const imgSaturation = parseFloat(formData.get('imgSaturation') as string) || 1.0

    if (!file || !craftType || !widthCm || !heightCm) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })
    }

    let imageBuffer: Buffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer)

    // Hash primii 8KB din imagine — identificator unic pentru a grupa versiunile aceleiași poze
    const imageHash = crypto.createHash('sha256').update(imageBuffer.slice(0, 8192)).digest('hex').slice(0, 16)

    // Convertește HEIC/HEIF la JPEG (Sharp 0.35 suportă HEIC dacă libheif e disponibil)
    const fname = (file.name || '').toLowerCase()
    if (fname.endsWith('.heic') || fname.endsWith('.heif')) {
      try {
        const sharp = (await import('sharp')).default
        imageBuffer = await sharp(imageBuffer).jpeg({ quality: 92 }).toBuffer()
      } catch {
        return NextResponse.json({
          error: 'Formatul HEIC nu este suportat. Te rugăm să convertești poza în JPG sau PNG înainte de upload (iPhone: Setări → Poze → Format → Cel mai compatibil).'
        }, { status: 400 })
      }
    }

    const schema = await generateSchema(imageBuffer, {
      craftType,
      canvasType: canvasType || '14CT',
      widthCm,
      heightCm,
      maxColors: maxColors || 30,
      imgBrightness,
      imgContrast,
      imgSaturation,
    })

    // Salvează imaginea originală în Supabase Storage (bucket privat)
    const fileName = `${user.id}/${Date.now()}.jpg`
    await supabase.storage.from('images').upload(fileName, imageBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })

    // Salvează schema în baza de date
    const { data: savedSchema, error: saveError } = await supabase.from('schemas').insert({
      user_id: user.id,
      name: `Schema ${new Date().toLocaleDateString('ro-RO')}`,
      craft_type: craftType,
      canvas_type: canvasType,
      width_stitches: schema.widthStitches,
      height_stitches: schema.heightStitches,
      width_cm: schema.widthCm,
      height_cm: schema.heightCm,
      max_colors: maxColors,
      colors_used: schema.colors.length,
      original_image_url: fileName,
      schema_data: schema,
      image_hash: imageHash,
    }).select().single()

    if (saveError) {
      console.error('Eroare salvare schema:', saveError.message)
      await logSecurity('generation_failed', user.email ?? user.id, `save_error: ${saveError.message}`)
    }

    // Scade o schemă din trial dacă e cazul
    if (subscription.plan === 'free_trial') {
      await supabase.from('subscriptions').update({
        schemas_remaining: (subscription.schemas_remaining ?? 0) - 1
      }).eq('user_id', user.id)
    }

    return NextResponse.json({ schema, schemaId: savedSchema?.id })

  } catch (error) {
    console.error('Eroare generare:', error)
    await logSecurity('generation_failed', user.email ?? user.id, String(error))
    return NextResponse.json({ error: 'Eroare la procesarea imaginii' }, { status: 500 })
  }
}

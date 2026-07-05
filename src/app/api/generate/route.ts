import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { generateSchema } from '@/lib/schema/generator'
import { aiPreprocess } from '@/lib/schema/aiPreprocess'
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

  // Verifică limita de scheme (trial și starter; pro și premium = nelimitat)
  if (subscription.plan !== 'pro' && subscription.plan !== 'premium' && (subscription.schemas_remaining ?? 0) <= 0) {
    await logSecurity('generation_blocked', user.email ?? user.id, `plan=${subscription.plan} schemas_remaining=0`)
    return NextResponse.json({ error: 'Limita de scheme depășită' }, { status: 403 })
  }

  // Rate limit: max 1 generare la 20s (pro/premium) sau 45s (starter/trial)
  const { data: lastSchema } = await supabase
    .from('schemas')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastSchema) {
    const secondsSinceLast = (Date.now() - new Date(lastSchema.created_at).getTime()) / 1000
    const minInterval = subscription.plan === 'pro' || subscription.plan === 'premium' ? 20 : 45
    if (secondsSinceLast < minInterval) {
      const wait = Math.ceil(minInterval - secondsSinceLast)
      return NextResponse.json({ error: `Așteaptă ${wait} secunde între generări.` }, { status: 429 })
    }
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
    const threadType = (formData.get('threadType') as 'wool' | 'silk' | 'cotton') || 'wool'

    if (!file || !craftType || !widthCm || !heightCm) {
      return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })
    }

    // Max 8MB per imagine — previne OOM și abuzuri
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({
        error: 'Imaginea e prea mare (max 8 MB). Comprimă poza sau alege o rezoluție mai mică.'
      }, { status: 400 })
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

    // Auto-resize la max 2500px pentru a reduce memoria Sharp (RAW/DSLR pot fi 8000px+)
    {
      const sharp = (await import('sharp')).default
      const meta = await sharp(imageBuffer).metadata()
      if ((meta.width ?? 0) > 2500 || (meta.height ?? 0) > 2500) {
        imageBuffer = await sharp(imageBuffer)
          .resize(2500, 2500, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 90 })
          .toBuffer()
      }
    }

    // AI preprocessing pentru utilizatorii Premium
    let aiSteps = null
    if (subscription.plan === 'premium') {
      const result = await aiPreprocess(imageBuffer)
      imageBuffer = result.buffer
      aiSteps = result.steps
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
      threadType,
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

    // Scade o schemă din planurile cu limită
    if (subscription.plan === 'free_trial' || subscription.plan === 'starter') {
      await supabase.from('subscriptions').update({
        schemas_remaining: Math.max(0, (subscription.schemas_remaining ?? 0) - 1)
      }).eq('user_id', user.id)
    }

    return NextResponse.json({ schema, schemaId: savedSchema?.id, aiSteps, _debugSaveError: saveError?.message ?? null, _debugCtx: { craftType, canvasType, plan: subscription.plan } })

  } catch (error) {
    console.error('Eroare generare:', error)
    await logSecurity('generation_failed', user.email ?? user.id, String(error))
    return NextResponse.json({ error: 'Eroare la procesarea imaginii' }, { status: 500 })
  }
}

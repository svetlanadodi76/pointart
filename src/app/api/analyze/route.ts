import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { analyzeImage } from '@/lib/schema/analyzeImage'

// Rate limit: max 1 analiză la 30s per utilizator (best-effort, per instanță serverless)
const analyzeLimiter = new Map<string, number>()

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

    const now = Date.now()
    const lastAnalyze = analyzeLimiter.get(user.id) ?? 0
    if (now - lastAnalyze < 30_000) {
      const wait = Math.ceil((30_000 - (now - lastAnalyze)) / 1000)
      return NextResponse.json({ error: `Așteaptă ${wait} secunde între analize.` }, { status: 429 })
    }
    analyzeLimiter.set(user.id, now)

    const subscription = await getSubscription(supabase, user.id)
    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ error: 'Abonament inactiv' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    if (!file) return NextResponse.json({ error: 'Lipsă imagine' }, { status: 400 })

    let imageBuffer: Buffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer)

    const fname = (file.name || '').toLowerCase()
    if (fname.endsWith('.heic') || fname.endsWith('.heif')) {
      const sharp = (await import('sharp')).default
      imageBuffer = await sharp(imageBuffer).jpeg({ quality: 92 }).toBuffer() as Buffer
    }

    const result = await analyzeImage(imageBuffer)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Eroare analiză:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Eroare server: ${msg}` }, { status: 500 })
  }
}

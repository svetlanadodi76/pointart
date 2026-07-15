import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/supabase/getSubscription'
import { aiPreprocess } from '@/lib/schema/aiPreprocess'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautorizat' }, { status: 401 })

  const subscription = await getSubscription(supabase, user.id)
  if (subscription?.plan !== 'premium') {
    return NextResponse.json({ error: 'Disponibil doar pentru Premium AI' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('image') as File
    if (!file) return NextResponse.json({ error: 'Lipsește imaginea' }, { status: 400 })
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Imaginea depășește 8 MB' }, { status: 400 })

    let imageBuffer = Buffer.from(await file.arrayBuffer() as ArrayBuffer)

    // Resize la max 2500px (identic cu generate route)
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

    const { buffer, steps } = await aiPreprocess(imageBuffer)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'X-AI-Steps': JSON.stringify(steps),
        'Access-Control-Expose-Headers': 'X-AI-Steps',
      },
    })
  } catch (error) {
    console.error('Preprocess error:', error)
    return NextResponse.json({ error: 'Eroare la procesare AI' }, { status: 500 })
  }
}

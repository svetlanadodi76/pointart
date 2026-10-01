'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'

const PaddleContext = createContext<Paddle | undefined>(undefined)

export function usePaddle() {
  return useContext(PaddleContext)
}

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle | undefined>()

  useEffect(() => {
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
    if (!env) throw new Error('NEXT_PUBLIC_PADDLE_ENV is not set')
    if (!token) throw new Error('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set')
    initializePaddle({
      environment: env as 'sandbox' | 'production',
      token,
    }).then(setPaddle)
  }, [])

  return (
    <PaddleContext.Provider value={paddle}>
      {children}
    </PaddleContext.Provider>
  )
}

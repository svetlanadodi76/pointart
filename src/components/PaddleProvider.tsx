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
    initializePaddle({
      environment: (process.env.NEXT_PUBLIC_PADDLE_ENV ?? 'sandbox') as 'sandbox' | 'production',
      token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
    }).then(setPaddle)
  }, [])

  return (
    <PaddleContext.Provider value={paddle}>
      {children}
    </PaddleContext.Provider>
  )
}

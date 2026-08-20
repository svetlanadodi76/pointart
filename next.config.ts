import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  { key: 'X-Frame-Options',         value: 'DENY' },
  { key: 'X-XSS-Protection',        value: '1; mode=block' },
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control',  value: 'on' },
]

const nextConfig: NextConfig = {
  // sharp: exclude din bundle webpack, încărcat din node_modules la runtime
  // @react-pdf/renderer: idem — conține WASM care nu poate fi bundled
  serverExternalPackages: ['sharp', '@react-pdf/renderer'],
  // Forțează includerea binarelor native @img în Lambda bundle Vercel
  // Fără aceasta, outputFileTracing omite fișierele .node și .so ale Sharp
  outputFileTracingIncludes: {
    '/**': ['./node_modules/sharp/**', './node_modules/@img/**'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;

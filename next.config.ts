import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseHost = supabaseUrl ? new URL(supabaseUrl).hostname : "*.supabase.co"

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js butuh unsafe-eval (dev) dan unsafe-inline untuk hydration
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' blob: data: https://${supabaseHost}`,
  "font-src 'self'",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
].join("; ")

const securityHeaders = [
  // Cegah clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Cegah MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // HSTS — paksa HTTPS selama 2 tahun
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Batasi info referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Matikan fitur browser yang tidak dipakai
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // CSP
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  async headers() {
    return [
      // Security headers untuk semua route
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Cegah caching halaman autentikasi & dashboard
      {
        source: "/((?!_next/static|_next/image|favicon.ico).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        ],
      },
    ]
  },
}

export default nextConfig;

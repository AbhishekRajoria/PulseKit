import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
})

const siteUrl = 'https://get-pulsekit.vercel.app'
const siteName = 'PulseKit'
const title = 'PulseKit — Notify your users. One API call.'
const description =
  'Developer notification infrastructure. One SDK call sends email, Slack, and in-app notifications — with retries, rate limiting, and a real-time delivery feed.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: siteName,
  title: {
    default: title,
    template: '%s · PulseKit',
  },
  description,
  creator: 'Abhishek Rajoria',
  authors: [{ name: 'Abhishek Rajoria', url: 'https://github.com/AbhishekRajoria' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title,
    description,
  },
  twitter: {
    card: 'summary',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#faf9f7',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main-content"
          className="pointer-events-none absolute left-4 top-4 z-50 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white opacity-0 transition-opacity focus:pointer-events-auto focus:opacity-100"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  )
}
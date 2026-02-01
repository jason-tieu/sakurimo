import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Analytics } from '@vercel/analytics/react';
import { Shell } from '@/components/shell/shell';
import SpeedInsightsClient from '@/components/SpeedInsightsClient';
import { ThemeToggle } from '@/components/theme-toggle';
import { StorageProvider } from '@/lib/storageContext';
import { SupabaseProvider } from '@/lib/supabase/SupabaseProvider';
import { ToastProvider } from '@/lib/toast';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sakurimo.app'),
  title: {
    default: 'Sakurimo | University Tracker',
    template: '%s | Sakurimo — University Tracker',
  },
  description:
    'A comprehensive university tracker to manage units, assignments, exams, and academic progress. Stay organized with your academic journey.',
  keywords: [
    'university tracker',
    'academic planner',
    'unit management',
    'assignment tracker',
    'exam scheduler',
    'grade tracker',
    'study planner',
    'academic calendar',
    'student productivity',
    'university tools',
    'academic organization',
    'student dashboard',
    'unit planner',
    'assignment management',
    'exam preparation',
    'academic progress',
    'university app',
    'student tracker',
  ],
  authors: [{ name: 'Sakurimo', url: 'https://sakurimo.app' }],
  creator: 'Sakurimo',
  publisher: 'Sakurimo',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: 'https://sakurimo.app/',
    title: 'Sakurimo — University Tracker & Academic Planner',
    description:
      'A comprehensive university tracker to manage units, assignments, exams, and academic progress. Stay organized with your academic journey.',
    siteName: 'Sakurimo — University Tracker',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Sakurimo — University Tracker & Academic Planner',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sakurimo — University Tracker & Academic Planner',
    description:
      'A comprehensive university tracker to manage units, assignments, exams, and academic progress. Stay organized with your academic journey.',
    images: ['/og.png'],
    creator: '@sakurimo_app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FF4D6D" />

        {/* Preconnect to Google Fonts for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

        {/* Preload hero image */}
        <link rel="preload" as="image" href="/images/avatar.webp" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Sakurimo',
              url: 'https://sakurimo.app',
              description: 'A comprehensive university tracker to manage units, assignments, exams, and academic progress.',
              applicationCategory: 'EducationalApplication',
              operatingSystem: 'Web Browser',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'Unit Management',
                'Assignment Tracking',
                'Exam Scheduling',
                'Grade Tracking',
                'Study Planning',
                'Academic Calendar',
                'Progress Monitoring',
              ],
            }),
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${geistMono.variable} bg-background text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <StorageProvider>
              <ToastProvider>
                <Shell>{children}</Shell>
                {/* Floating Theme Toggle */}
                <div className="fixed bottom-6 right-6 z-50">
                  <ThemeToggle />
                </div>
              </ToastProvider>
            </StorageProvider>
          </SupabaseProvider>
        </ThemeProvider>
        <SpeedInsightsClient />
        <Analytics />
      </body>
    </html>
  );
}

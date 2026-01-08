import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
// removed ThemeProvider import to avoid conflicting theme managers
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import { CookieConsentBanner } from "@/components/cookie-consent";

// Google Tag Manager ID
const GTM_ID = "GTM-KRHF2P8N";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['ui-monospace', 'monospace'],
  adjustFontFallback: true,
});

// Viewport configuration (separate export in Next.js 14+)
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" }
  ]
};

export const metadata = {
  title: {
    default: "VulnIQ",
    template: "%s | VulnIQ",
  },
  description: "VulnIQ allows you to seamlessly switch between top-tier providers like OpenAI, Anthropic, Google, and Meta to find the perfect balance of performance and cost for intelligent security analysis.",
  keywords: ["security", "code analysis", "vulnerability detection", "AI security", "code review", "OpenAI", "Anthropic", "Google", "Meta"],
  authors: [{ name: "VulnIQ" }],
  creator: "VulnIQ",
  publisher: "VulnIQ",
  metadataBase: new URL("https://vulniq.org"),
  
  // Application name for PWA and browser
  applicationName: "VulnIQ",
  
  // Search engine verification tokens (replace with actual values)
  verification: {
    google: "z6QaeExEQuN34I5J8o_p9ua881c3N2LDCEoLJr_12Q8",
  },
  
  // Apple Web App configuration
  appleWebApp: {
    title: "VulnIQ",
    statusBarStyle: "default",
    capable: true
  },
  
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vulniq.org",
    siteName: "VulnIQ",
    title: "VulnIQ - Intelligent Security for the Modern Codebase",
    description: "VulnIQ allows you to seamlessly switch between top-tier providers like OpenAI, Anthropic, Google, and Meta to find the perfect balance of performance and cost.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "VulnIQ - Intelligent Security for the Modern Codebase",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VulnIQ - Intelligent Security for the Modern Codebase",
    description: "VulnIQ allows you to seamlessly switch between top-tier providers like OpenAI, Anthropic, Google, and Meta.",
    images: ["/og-default.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57", type: "image/png" },
      { url: "/apple-icon-60x60.png", sizes: "60x60", type: "image/png" },
      { url: "/apple-icon-72x72.png", sizes: "72x72", type: "image/png" },
      { url: "/apple-icon-76x76.png", sizes: "76x76", type: "image/png" },
      { url: "/apple-icon-114x114.png", sizes: "114x114", type: "image/png" },
      { url: "/apple-icon-120x120.png", sizes: "120x120", type: "image/png" },
      { url: "/apple-icon-144x144.png", sizes: "144x144", type: "image/png" },
      { url: "/apple-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-icon-180x180.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  // Structured data for Google (Organization + WebSite + SiteNavigationElement)
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://vulniq.org/#organization",
        "name": "VulnIQ",
        "url": "https://vulniq.org",
        "logo": {
          "@type": "ImageObject",
          "url": "https://vulniq.org/web-app-manifest-512x512.png",
          "width": 512,
          "height": 512
        },
        "sameAs": []
      },
      {
        "@type": "WebSite",
        "@id": "https://vulniq.org/#website",
        "url": "https://vulniq.org",
        "name": "VulnIQ",
        "description": "VulnIQ allows you to seamlessly switch between top-tier providers like OpenAI, Anthropic, Google, and Meta to find the perfect balance of performance and cost.",
        "publisher": {
          "@id": "https://vulniq.org/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://vulniq.org/?s={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "WebPage",
        "@id": "https://vulniq.org/#webpage",
        "url": "https://vulniq.org",
        "name": "VulnIQ - Intelligent Security for the Modern Codebase",
        "isPartOf": {
          "@id": "https://vulniq.org/#website"
        },
        "about": {
          "@id": "https://vulniq.org/#organization"
        },
        "description": "VulnIQ allows you to seamlessly switch between top-tier providers like OpenAI, Anthropic, Google, and Meta to find the perfect balance of performance and cost."
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Login",
        "url": "https://vulniq.org/login"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "About",
        "url": "https://vulniq.org/about"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Changelog",
        "url": "https://vulniq.org/changelog"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Privacy Policy",
        "url": "https://vulniq.org/privacy"
      },
      {
        "@type": "SiteNavigationElement",
        "name": "Terms & Conditions",
        "url": "https://vulniq.org/terms"
      }
    ]
  };

  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `}
        </Script>
        <meta name="apple-mobile-web-app-title" content="VulnIQ" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Structured Data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
        {/* Inline script to apply theme immediately to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var settings = localStorage.getItem('app-settings');
                  if (settings) {
                    var parsed = JSON.parse(settings);
                    if (parsed.mode === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-x-hidden`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          tabIndex={0}
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <Providers>
          {children}
          <Toaster position="top-center" closeButton />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  );
}

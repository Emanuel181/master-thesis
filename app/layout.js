import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// removed ThemeProvider import to avoid conflicting theme managers
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";
import { CookieConsentBanner } from "@/components/cookie-consent";

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
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "VulnIQ Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VulnIQ - Intelligent Security for the Modern Codebase",
    description: "VulnIQ allows you to seamlessly switch between top-tier providers like OpenAI, Anthropic, Google, and Meta.",
    images: ["/web-app-manifest-512x512.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
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
        <meta name="apple-mobile-web-app-title" content="VulnIQ" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
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

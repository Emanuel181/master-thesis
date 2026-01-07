import BlogPageClient from "./blog-page-client";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vulniq.org";

// ISR: Revalidate blog listing every 30 minutes (1800 seconds)
// This ensures new posts appear relatively quickly while maintaining performance
export const revalidate = 1800;

/**
 * Blog Listing Page - Server Component with Static Metadata
 * 
 * This page exports static metadata for SEO while delegating
 * the interactive content to a client component.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4
 */

export const metadata = {
  title: "Security Blog | VulnIQ",
  description: "Stay informed with the latest trends, best practices, and insights in code security and vulnerability management. Expert articles on AI-powered security analysis.",
  keywords: [
    "security blog",
    "vulnerability management",
    "code security",
    "cybersecurity",
    "AI security",
    "code analysis",
    "security best practices",
    "vulnerability detection",
    "secure coding",
    "application security"
  ],
  authors: [{ name: "VulnIQ Team", url: `${siteUrl}/about` }],
  creator: "VulnIQ",
  publisher: "VulnIQ",
  openGraph: {
    title: "Security Blog | VulnIQ",
    description: "Stay informed with the latest trends, best practices, and insights in code security and vulnerability management.",
    type: "website",
    url: `${siteUrl}/blog`,
    siteName: "VulnIQ",
    locale: "en_US",
    images: [
      {
        url: `${siteUrl}/og-default.png`,
        width: 1200,
        height: 630,
        alt: "VulnIQ Security Blog",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Security Blog | VulnIQ",
    description: "Stay informed with the latest trends, best practices, and insights in code security and vulnerability management.",
    site: "@vulniqsecurity",
    creator: "@vulniqsecurity",
    images: [`${siteUrl}/og-default.png`],
  },
  alternates: {
    canonical: `${siteUrl}/blog`,
  },
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

export default function BlogPage() {
  return <BlogPageClient />;
}

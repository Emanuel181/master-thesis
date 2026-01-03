import { getBlogPost, getAllSlugs } from "@/lib/blog-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vulniq.com";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return {
      title: "Post Not Found | VulnIQ Blog",
      description: "The requested blog post could not be found.",
    };
  }

  const ogImage = `${siteUrl}/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(post.category)}`;

  return {
    title: `${post.title} | VulnIQ Blog`,
    description: post.excerpt,
    keywords: [
      post.category,
      "security",
      "vulnerability",
      "code security",
      "VulnIQ",
      ...post.title.toLowerCase().split(" ").filter(word => word.length > 4),
    ],
    authors: [{ name: post.author }],
    creator: post.author,
    publisher: "VulnIQ",
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updatedDate || post.date,
      authors: [post.author],
      section: post.category,
      tags: [post.category, "security", "vulnerability"],
      url: `${siteUrl}/blog/${slug}`,
      siteName: "VulnIQ",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [ogImage],
      creator: "@vulniqsecurity",
    },
    alternates: {
      canonical: `${siteUrl}/blog/${slug}`,
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
}

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}


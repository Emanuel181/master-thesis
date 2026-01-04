import { prisma } from "@/lib/prisma";
import BlogPostContent from "./blog-post-content";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vulniq.com";

// Helper function to get post from database
async function getPostFromDatabase(slug) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        authorName: true,
        authorEmail: true,
        iconName: true,
        iconPosition: true,
        iconColor: true,
        gradient: true,
        coverImage: true,
        coverType: true,
        readTime: true,
        publishedAt: true,
        contentMarkdown: true,
        content: true,
        contentJson: true,
        status: true,
      },
    });

    if (!article || article.status !== "PUBLISHED") {
      return null;
    }

    // Transform to match the blog post structure
    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      author: article.authorName,
      authorEmail: article.authorEmail,
      date: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      readTime: article.readTime || "5 min read",
      iconName: article.iconName || "Shield",
      iconPosition: article.iconPosition || "center",
      iconColor: article.iconColor || "white",
      gradient: article.gradient,
      coverImage: article.coverImage,
      coverType: article.coverType || "gradient",
      featured: false,
      content: article.contentMarkdown || article.content || "",
      contentJson: article.contentJson,
      isUserSubmitted: true,
    };
  } catch (error) {
    console.error("Error fetching article from database:", error);
    return null;
  }
}

// Helper function to get related posts from database
async function getRelatedPosts(slug, currentPost, limit = 3) {
  try {
    const dbArticles = await prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        slug: { not: slug },
        ...(currentPost?.category && { category: currentPost.category }),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        authorName: true,
        iconName: true,
        iconColor: true,
        gradient: true,
        coverImage: true,
        coverType: true,
        readTime: true,
        publishedAt: true,
      },
      take: limit,
      orderBy: { publishedAt: "desc" },
    });

    return dbArticles.map((article) => ({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt,
      category: article.category,
      author: article.authorName,
      iconName: article.iconName || "Shield",
      iconColor: article.iconColor || "white",
      gradient: article.gradient,
      coverImage: article.coverImage,
      coverType: article.coverType || "gradient",
      readTime: article.readTime || "5 min read",
      date: article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
      isUserSubmitted: true,
    }));
  } catch (error) {
    console.error("Error fetching related posts from database:", error);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;

  // Get post from database
  const post = await getPostFromDatabase(slug);

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
  // Get all published article slugs from database
  try {
    const articles = await prisma.article.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return articles.map((article) => ({ slug: article.slug }));
  } catch (error) {
    console.error("Error fetching article slugs:", error);
    return [];
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;

  // Get post from database
  const post = await getPostFromDatabase(slug);
  let relatedPosts = [];

  // Get related posts from database
  if (post) {
    relatedPosts = await getRelatedPosts(slug, post, 3);
  }

  return <BlogPostContent post={post} relatedPosts={relatedPosts} />;
}

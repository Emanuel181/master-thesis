/**
 * SEO Utility Functions
 * 
 * This module provides utility functions for generating SEO-related
 * structured data and metadata for the VulnIQ application.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vulniq.org";
const SITE_NAME = "VulnIQ";

/**
 * Generates a BlogPosting JSON-LD schema for a blog post.
 * This structured data helps search engines understand the content
 * and can enable rich snippets in search results.
 * 
 * @param {Object} post - The blog post data
 * @param {string} post.slug - The URL slug of the post
 * @param {string} post.title - The title of the post
 * @param {string} post.excerpt - A brief description/excerpt of the post
 * @param {string} post.author - The author's name
 * @param {string} [post.authorUrl] - Optional URL to author's profile
 * @param {string|Date} post.publishedAt - The publication date
 * @param {string|Date} [post.updatedAt] - The last modification date
 * @param {string} [post.coverImage] - URL to the post's cover image
 * @param {string} [post.category] - The post's category
 * @param {string} [siteUrl] - Override the default site URL
 * @returns {Object} The BlogPosting JSON-LD schema object
 */
export function generateBlogPostingSchema(post, siteUrl = SITE_URL) {
  const publishedDate = post.publishedAt 
    ? new Date(post.publishedAt).toISOString() 
    : new Date().toISOString();
  
  const modifiedDate = post.updatedAt 
    ? new Date(post.updatedAt).toISOString() 
    : publishedDate;

  const imageUrl = post.coverImage 
    ? (post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`)
    : `${siteUrl}/web-app-manifest-512x512.png`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`
    },
    headline: post.title,
    description: post.excerpt,
    image: imageUrl,
    dateCreated: publishedDate,
    datePublished: publishedDate,
    dateModified: modifiedDate,
    author: {
      "@type": "Person",
      name: post.author || "VulnIQ Team",
      url: post.authorUrl || `${siteUrl}/about`
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/web-app-manifest-512x512.png`,
        width: 512,
        height: 512
      }
    },
    inLanguage: "en-US",
    isFamilyFriendly: true,
    ...(post.category && { articleSection: post.category })
  };
}

/**
 * Generates an Article JSON-LD schema (alternative to BlogPosting).
 * Use this for more general article content.
 * 
 * @param {Object} article - The article data
 * @param {string} [siteUrl] - Override the default site URL
 * @returns {Object} The Article JSON-LD schema object
 */
export function generateArticleSchema(article, siteUrl = SITE_URL) {
  const schema = generateBlogPostingSchema(article, siteUrl);
  schema["@type"] = "Article";
  return schema;
}

/**
 * Generates a BreadcrumbList JSON-LD schema for navigation.
 * 
 * @param {Array<{name: string, url: string}>} items - Breadcrumb items
 * @param {string} [siteUrl] - Override the default site URL
 * @returns {Object} The BreadcrumbList JSON-LD schema object
 */
export function generateBreadcrumbSchema(items, siteUrl = SITE_URL) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`
    }))
  };
}

/**
 * Generates a BreadcrumbList JSON-LD schema specifically for blog posts.
 * Creates a Home > Blog > Post Title hierarchy.
 * 
 * @param {Object} post - The blog post data
 * @param {string} post.title - The title of the post
 * @param {string} post.slug - The URL slug of the post
 * @param {string} [siteUrl] - Override the default site URL
 * @returns {Object} The BreadcrumbList JSON-LD schema object
 */
export function generateBlogBreadcrumbSchema(post, siteUrl = SITE_URL) {
  return generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: post.title, url: `/blog/${post.slug}` }
  ], siteUrl);
}

/**
 * Validates that a BlogPosting schema has all required properties.
 * Useful for testing and debugging.
 * 
 * @param {Object} schema - The schema to validate
 * @returns {{valid: boolean, missingProperties: string[]}}
 */
export function validateBlogPostingSchema(schema) {
  const requiredProperties = [
    '@context',
    '@type',
    'mainEntityOfPage',
    'headline',
    'description',
    'image',
    'dateCreated',
    'datePublished',
    'dateModified',
    'author',
    'publisher',
    'inLanguage',
    'isFamilyFriendly'
  ];

  const missingProperties = requiredProperties.filter(prop => {
    if (prop === 'mainEntityOfPage') {
      return !schema.mainEntityOfPage || !schema.mainEntityOfPage['@type'] || !schema.mainEntityOfPage['@id'];
    }
    if (prop === 'author') {
      return !schema.author || !schema.author['@type'] || !schema.author.name || !schema.author.url;
    }
    if (prop === 'publisher') {
      return !schema.publisher || !schema.publisher['@type'] || !schema.publisher.name || !schema.publisher.logo;
    }
    return schema[prop] === undefined || schema[prop] === null;
  });

  return {
    valid: missingProperties.length === 0,
    missingProperties
  };
}

export { SITE_URL, SITE_NAME };

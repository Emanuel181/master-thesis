import { prisma } from "@/lib/prisma";

const BASE_URL = 'https://vulniq.org';

export default async function sitemap() {
    // Static pages with appropriate priorities
    const staticPages = [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.00,
        },
        {
            url: `${BASE_URL}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.90,
        },
        {
            url: `${BASE_URL}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.80,
        },
        {
            url: `${BASE_URL}/changelog`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.80,
        },
        {
            url: `${BASE_URL}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.80,
        },
        {
            url: `${BASE_URL}/terms`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.80,
        },
        {
            url: `${BASE_URL}/security`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.80,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.64,
        },
        {
            url: `${BASE_URL}/supporters`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.64,
        },
        {
            url: `${BASE_URL}/demo`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.70,
        },
        {
            url: `${BASE_URL}/health`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.30,
        },
        {
            url: `${BASE_URL}/site-map`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.50,
        },
    ];

    // Dynamic blog posts from database
    let blogPosts = [];
    try {
        const articles = await prisma.article.findMany({
            where: { status: 'PUBLISHED' },
            select: {
                slug: true,
                publishedAt: true,
                updatedAt: true,
            },
            orderBy: { publishedAt: 'desc' },
        });

        blogPosts = articles.map((article) => ({
            url: `${BASE_URL}/blog/${article.slug}`,
            lastModified: article.updatedAt || article.publishedAt || new Date(),
            changeFrequency: 'weekly',
            priority: 0.80,
        }));
    } catch (error) {
        console.error('Error fetching articles for sitemap:', error);
        // Continue with static pages only if database fails
    }

    return [...staticPages, ...blogPosts];
}

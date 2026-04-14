import { prisma } from "@/lib/prisma";
import { locales } from "@/i18n/config";

const BASE_URL = 'https://vulniq.org';

function makeAlternates(path) {
    return {
        languages: Object.fromEntries(
            locales.map(l => [l, `${BASE_URL}/${l}${path}`])
        ),
    };
}

export default async function sitemap() {
    const staticRoutes = [
        { path: '', changeFrequency: 'weekly', priority: 1.00 },
        { path: '/blog', changeFrequency: 'daily', priority: 0.90 },
        { path: '/login', changeFrequency: 'monthly', priority: 0.80 },
        { path: '/changelog', changeFrequency: 'weekly', priority: 0.80 },
        { path: '/privacy', changeFrequency: 'yearly', priority: 0.80 },
        { path: '/terms', changeFrequency: 'yearly', priority: 0.80 },
        { path: '/security', changeFrequency: 'yearly', priority: 0.80 },
        { path: '/about', changeFrequency: 'monthly', priority: 0.64 },
        { path: '/supporters', changeFrequency: 'weekly', priority: 0.64 },
        { path: '/demo', changeFrequency: 'monthly', priority: 0.70 },
        { path: '/site-map', changeFrequency: 'monthly', priority: 0.50 },
    ];

    // Generate entries for all locales
    const staticPages = staticRoutes.flatMap((route) =>
        locales.map((locale) => ({
            url: `${BASE_URL}/${locale}${route.path}`,
            lastModified: new Date(),
            changeFrequency: route.changeFrequency,
            priority: route.priority,
            alternates: makeAlternates(route.path),
        }))
    );

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

        blogPosts = articles.flatMap((article) =>
            locales.map((locale) => ({
                url: `${BASE_URL}/${locale}/blog/${article.slug}`,
                lastModified: article.updatedAt || article.publishedAt || new Date(),
                changeFrequency: 'weekly',
                priority: 0.80,
                alternates: makeAlternates(`/blog/${article.slug}`),
            }))
        );
    } catch (error) {
        console.error('Error fetching articles for sitemap:', error);
    }

    return [...staticPages, ...blogPosts];
}

const BASE_URL = 'https://vulniq.org';

export default async function sitemap() {
    return [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.00,
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
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.64,
        },
        {
            url: `${BASE_URL}/site-map`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.50,
        },
    ];
}

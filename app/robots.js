export default function robots() {
    return {
        rules: {
            userAgent: '*',
            disallow: ['/private/', '/api/', '/admin/'],
        },
        sitemap: 'https://vulniq.org/sitemap.xml',
    }
}

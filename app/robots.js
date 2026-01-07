export default function robots() {
    return {
        rules: {
            userAgent: '*',
            allow: ['/'],
            disallow: ['/private/', '/api/', '/admin/', '/dashboard/', '/profile/', '/editor/'],
        },
        sitemap: 'https://vulniq.org/sitemap.xml',
    }
}

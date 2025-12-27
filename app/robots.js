export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/api/'],
    },
    sitemap: 'https://vulniq.org/sitemap.xml',
  }
}

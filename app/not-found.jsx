import { Link } from "@/i18n/navigation";
import { Home } from "lucide-react";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
          <h1 style={{ fontSize: '8rem', fontWeight: 900, margin: 0, lineHeight: 1, background: 'linear-gradient(to bottom, #fff, #666)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</h1>
          <p style={{ fontSize: '1.25rem', color: '#a1a1aa', marginTop: '16px' }}>Page not found</p>
          <a href="/en" style={{ marginTop: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px', backgroundColor: '#fff', color: '#000', textDecoration: 'none', fontWeight: 500 }}>
            Go home
          </a>
        </div>
      </body>
    </html>
  );
}

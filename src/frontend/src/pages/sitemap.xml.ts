import type { APIRoute } from 'astro';

const SITE = 'https://osmagent.com';

const STATIC_PAGES = [
  { url: '/',          changefreq: 'daily',   priority: '1.0' },
  { url: '/discovery', changefreq: 'daily',   priority: '0.9' },
  { url: '/docs',      changefreq: 'weekly',  priority: '0.8' },
  { url: '/agent',     changefreq: 'monthly', priority: '0.7' },
  { url: '/signup',    changefreq: 'monthly', priority: '0.5' },
  { url: '/login',     changefreq: 'monthly', priority: '0.5' },
];

export const GET: APIRoute = async () => {
  const API_URL = import.meta.env.PUBLIC_API_URL || 'https://api.osmagent.com';

  let skillUrls: { url: string; changefreq: string; priority: string }[] = [];

  try {
    const res  = await fetch(`${API_URL}/registry/search?q=`);
    const data = await res.json();
    const skills: { name: string }[] = data.objects || [];

    skillUrls = skills.map(s => ({
      url:        `/skill/${encodeURIComponent(s.name)}`,
      changefreq: 'weekly',
      priority:   '0.6',
    }));
  } catch {
    // if API is unavailable, serve sitemap with just static pages
  }

  const today = new Date().toISOString().split('T')[0];
  const allPages = [...STATIC_PAGES, ...skillUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(p => `  <url>
    <loc>${SITE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { AddressInfo } from 'node:net';
import { afterEach, describe, expect, it } from 'vitest';
import { createServerApp } from '../../server/app';
import { ServerDatabase } from '../../server/db';
import { buildSeoJsonLdPayload } from '../components/SeoHead';
import { CITY_PAGES } from '../shared/cityPages';
import {
  INITIAL_BLOG_POSTS,
  INITIAL_SERVICES,
  INITIAL_SETTINGS,
  INITIAL_TESTIMONIALS,
} from '../shared/seedData';
import { FAQ_ITEMS } from '../shared/faqData';

interface StartedSeoServer {
  baseUrl: string;
  db: ServerDatabase;
  tempDir: string;
  close: () => Promise<void>;
}

const activeServers: StartedSeoServer[] = [];

async function startSeoServer(appUrl = 'https://stavparta.cz'): Promise<StartedSeoServer> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stavparta-phase8-'));
  const uploadDir = path.join(tempDir, 'uploads');
  const db = new ServerDatabase(path.join(tempDir, 'stavparta.db'), { uploadDir });
  const { app } = createServerApp({
    db,
    disableRateLimit: true,
    appUrl,
  });

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address() as AddressInfo;

  const instance: StartedSeoServer = {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    db,
    tempDir,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
      db.close();
      fs.rmSync(tempDir, { recursive: true, force: true });
    },
  };
  activeServers.push(instance);
  return instance;
}

afterEach(async () => {
  while (activeServers.length > 0) {
    const srv = activeServers.pop();
    if (srv) {
      await srv.close();
    }
  }
});

const rootDir = path.resolve(import.meta.dirname, '../..');

describe('Phase 8 SEO & Clean Browser Routing', () => {
  it('serves /robots.txt allowing public pages and disallowing /admin and /api', async () => {
    const srv = await startSeoServer('https://stavparta.cz');
    const res = await fetch(`${srv.baseUrl}/robots.txt`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/plain');
    const text = await res.text();
    expect(text).toContain('User-agent: *');
    expect(text).toContain('Allow: /');
    expect(text).toContain('Disallow: /admin');
    expect(text).toContain('Disallow: /api');
    expect(text).toContain('Sitemap: https://stavparta.cz/sitemap.xml');
  });

  it('serves dynamic /sitemap.xml with active services, published blog posts, and city pages', async () => {
    const srv = await startSeoServer('https://stavparta.cz');

    // Add a draft blog post and inactive service to verify they are excluded from sitemap
    srv.db.addBlogPost({
      slug: 'tajny-koncept-clanku',
      title: 'Neveřejný koncept',
      category: 'Údržba interiéru',
      publishedAt: '2026-06-01',
      readTimeMinutes: 3,
      excerpt: 'Koncept.',
      contentSections: [{ heading: 'Úvod', text: 'Obsah' }],
      practicalTips: [],
      image: '/images/hero_craft_construction_1793401118434-1376.webp',
      imageAlt: 'Název',
      relatedServiceId: 'srv-bytova-jadra',
      author: 'STAVPARTA',
      isPublished: false,
    });
    srv.db.addService({
      slug: 'neaktivni-sluzba-test',
      title: 'Neaktivní test',
      category: 'Test',
      shortDescription: 'Neaktivní',
      fullDescription: 'Neaktivní',
      iconName: 'Wrench',
      order: 99,
      isActive: false,
      metaTitle: 'Neaktivní',
      metaDescription: 'Neaktivní',
    });

    const res = await fetch(`${srv.baseUrl}/sitemap.xml`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/xml');
    const xml = await res.text();

    expect(xml).toContain('<loc>https://stavparta.cz/</loc>');
    expect(xml).toContain('<loc>https://stavparta.cz/sluzba/renovace-bytovych-jader</loc>');
    expect(xml).toContain('<loc>https://stavparta.cz/lokalita/zabreh-na-morave</loc>');
    expect(xml).toContain('<loc>https://stavparta.cz/lokalita/olomouc</loc>');
    for (const post of INITIAL_BLOG_POSTS.filter((p) => p.isPublished)) {
      expect(xml).toContain(`<loc>https://stavparta.cz/blog/${post.slug}</loc>`);
    }
    expect(xml).not.toContain('tajny-koncept-clanku');
    expect(xml).not.toContain('neaktivni-sluzba-test');
  });

  it('builds valid Schema.org JSON-LD without fabricated aggregateRating when only demo reviews exist', () => {
    const homeGraph = buildSeoJsonLdPayload({
      origin: 'https://stavparta.cz',
      canonicalUrl: 'https://stavparta.cz/',
      pageType: 'home',
      settings: INITIAL_SETTINGS,
      services: INITIAL_SERVICES,
      testimonials: INITIAL_TESTIMONIALS, // all seed testimonials are isDemo: true
    })['@graph'] as Array<Record<string, unknown>>;

    const business = homeGraph.find((n) => n['@type'] === 'HomeAndConstructionBusiness');
    expect(business).toBeDefined();
    expect(business?.aggregateRating).toBeUndefined();
    expect((business?.address as Record<string, unknown>)?.addressLocality).toBe('Zábřeh na Moravě');

    const faqPage = homeGraph.find((n) => n['@type'] === 'FAQPage');
    expect(faqPage).toBeDefined();
    expect((faqPage?.mainEntity as Array<unknown>).length).toBe(FAQ_ITEMS.length);

    // When a real non-demo published review with consent is present, aggregateRating is included
    const withRealReview = buildSeoJsonLdPayload({
      origin: 'https://stavparta.cz',
      canonicalUrl: 'https://stavparta.cz/',
      pageType: 'home',
      settings: INITIAL_SETTINGS,
      services: INITIAL_SERVICES,
      testimonials: [
        ...INITIAL_TESTIMONIALS,
        {
          id: 'real-1',
          clientName: 'Novák Petr',
          location: 'Zábřeh na Moravě',
          projectType: 'Renovace bytového jádra',
          text: 'Spokojenost.',
          rating: 5,
          year: '2026',
          hasConsent: true,
          isPublished: true,
          isDemo: false,
        },
      ],
    })['@graph'] as Array<Record<string, unknown>>;

    const businessWithRating = withRealReview.find(
      (n) => n['@type'] === 'HomeAndConstructionBusiness'
    );
    expect(businessWithRating?.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 5,
      reviewCount: 1,
      bestRating: 5,
      worstRating: 1,
    });
  });

  it('builds Service, BlogPosting, City Service, and BreadcrumbList schemas for subpages', () => {
    const sampleService = INITIAL_SERVICES[0];
    const servicePayload = buildSeoJsonLdPayload({
      origin: 'https://stavparta.cz',
      canonicalUrl: `https://stavparta.cz/sluzba/${sampleService.slug}`,
      pageType: 'service',
      settings: INITIAL_SETTINGS,
      services: INITIAL_SERVICES,
      testimonials: INITIAL_TESTIMONIALS,
      activeService: sampleService,
      breadcrumbs: [
        { name: 'Úvod', path: '/' },
        { name: sampleService.title, path: `/sluzba/${sampleService.slug}` },
      ],
    })['@graph'] as Array<Record<string, unknown>>;

    expect(servicePayload.some((n) => n['@type'] === 'Service')).toBe(true);
    expect(servicePayload.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);

    const samplePost = INITIAL_BLOG_POSTS[0];
    const blogPayload = buildSeoJsonLdPayload({
      origin: 'https://stavparta.cz',
      canonicalUrl: `https://stavparta.cz/blog/${samplePost.slug}`,
      pageType: 'blog',
      settings: INITIAL_SETTINGS,
      services: INITIAL_SERVICES,
      testimonials: INITIAL_TESTIMONIALS,
      activePost: samplePost,
      breadcrumbs: [
        { name: 'Úvod', path: '/' },
        { name: 'Blog', path: '/#blog' },
        { name: samplePost.title, path: `/blog/${samplePost.slug}` },
      ],
    })['@graph'] as Array<Record<string, unknown>>;

    expect(blogPayload.some((n) => n['@type'] === 'BlogPosting')).toBe(true);
    expect(blogPayload.some((n) => n['@type'] === 'BreadcrumbList')).toBe(true);
  });

  it('provides regional city landing configs anchored in Zabřeh na Morave and static SEO assets', () => {
    const slugs = CITY_PAGES.map((c) => c.slug);
    expect(slugs).toContain('zabreh-na-morave');
    expect(slugs).toContain('olomouc');
    expect(slugs).toContain('prostejov');
    expect(slugs).toContain('prerov');
    expect(slugs).toContain('sumperk');
    expect(slugs).toContain('litovel');

    expect(fs.existsSync(path.join(rootDir, 'public/favicon.svg'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'public/icon-192.png'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'public/icon-512.png'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'public/og-image.jpg'))).toBe(true);
    expect(fs.existsSync(path.join(rootDir, 'public/site.webmanifest'))).toBe(true);

    const appSource = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
    expect(appSource).toContain('/sluzba/:slug');
    expect(appSource).toContain('/blog/:slug');
    expect(appSource).toContain('/lokalita/:citySlug');
    expect(appSource).toContain('navigate(`/sluzba/${slug}`, { replace: true })');
    expect(appSource).toContain('navigate(`/blog/${slug}`, { replace: true })');
  });
});

import React, { useEffect } from 'react';
import { BlogPost, ServiceItem, SiteSettings, Testimonial } from '../types';
import { FAQ_ITEMS } from '../shared/faqData';
import { CityPageConfig } from '../shared/cityPages';

export interface SeoBreadcrumbItem {
  name: string;
  path: string;
}

export interface BuildSeoJsonLdOptions {
  origin: string;
  canonicalUrl: string;
  pageType: 'home' | 'service' | 'blog' | 'city' | 'not_found';
  settings: SiteSettings;
  services: ServiceItem[];
  testimonials: Testimonial[];
  activeService?: ServiceItem;
  activePost?: BlogPost;
  activeCity?: CityPageConfig;
  breadcrumbs?: SeoBreadcrumbItem[];
}

export function buildSeoJsonLdPayload(options: BuildSeoJsonLdOptions): Record<string, unknown> {
  const {
    origin,
    canonicalUrl,
    pageType,
    settings,
    services,
    testimonials,
    activeService,
    activePost,
    activeCity,
    breadcrumbs,
  } = options;

  const cleanOrigin = origin.replace(/\/+$/, '');
  const activeServices = services.filter((s) => s.isActive);

  // Only emit aggregateRating when authentic non-demo published testimonials with consent exist
  const verifiedTestimonials = testimonials.filter(
    (t) => t.isPublished && t.hasConsent && !t.isDemo
  );

  const businessEntity: Record<string, unknown> = {
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${cleanOrigin}/#business`,
    name: settings.brandName || 'STAVPARTA',
    description: settings.seoDescription,
    url: cleanOrigin,
    image: `${cleanOrigin}/og-image.jpg`,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: settings.headquarters || 'Zábřeh na Moravě',
      postalCode: '789 01',
      addressRegion: 'Olomoucký kraj',
      addressCountry: 'CZ',
    },
    areaServed: settings.primaryLocations,
    knowsAbout: activeServices.map((s) => s.title),
  };

  if (settings.phone.trim()) {
    businessEntity.telephone = settings.phone.trim();
  }
  if (settings.email.trim()) {
    businessEntity.email = settings.email.trim();
  }
  if (verifiedTestimonials.length > 0) {
    const ratingSum = verifiedTestimonials.reduce((acc, t) => acc + t.rating, 0);
    const avg = Number((ratingSum / verifiedTestimonials.length).toFixed(2));
    businessEntity.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg,
      reviewCount: verifiedTestimonials.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const graph: Record<string, unknown>[] = [businessEntity];

  if (breadcrumbs && breadcrumbs.length > 0) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((bc, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: bc.name,
        item: `${cleanOrigin}${bc.path.startsWith('/') ? bc.path : `/${bc.path}`}`,
      })),
    });
  }

  if (pageType === 'home') {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    });
  }

  if (pageType === 'service' && activeService) {
    graph.push({
      '@type': 'Service',
      name: activeService.title,
      serviceType: activeService.category,
      description: activeService.metaDescription || activeService.shortDescription,
      url: canonicalUrl,
      provider: { '@id': `${cleanOrigin}/#business` },
      areaServed: settings.primaryLocations,
    });
  }

  if (pageType === 'blog' && activePost) {
    graph.push({
      '@type': 'BlogPosting',
      headline: activePost.title,
      description: activePost.excerpt,
      datePublished: activePost.publishedAt,
      dateModified: activePost.publishedAt,
      image: activePost.image.startsWith('http')
        ? activePost.image
        : `${cleanOrigin}${activePost.image.startsWith('/') ? activePost.image : `/${activePost.image}`}`,
      author: {
        '@type': 'Organization',
        name: activePost.author || settings.brandName || 'STAVPARTA',
      },
      publisher: {
        '@type': 'Organization',
        name: settings.brandName || 'STAVPARTA',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl,
      },
    });
  }

  if (pageType === 'city' && activeCity) {
    graph.push({
      '@type': 'Service',
      name: activeCity.headline,
      description: activeCity.metaDescription,
      url: canonicalUrl,
      provider: { '@id': `${cleanOrigin}/#business` },
      areaServed: {
        '@type': 'City',
        name: activeCity.cityName,
      },
    });
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

interface SeoHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  pageType: 'home' | 'service' | 'blog' | 'city' | 'not_found';
  ogType?: 'website' | 'article';
  ogImage?: string;
  noIndex?: boolean;
  settings: SiteSettings;
  services: ServiceItem[];
  testimonials: Testimonial[];
  activeService?: ServiceItem;
  activePost?: BlogPost;
  activeCity?: CityPageConfig;
  breadcrumbs?: SeoBreadcrumbItem[];
}

const upsertMeta = (
  attribute: 'name' | 'property',
  key: string,
  content: string
): void => {
  let el = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attribute, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

const upsertLink = (rel: string, href: string): void => {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
};

export const SeoHead: React.FC<SeoHeadProps> = ({
  title,
  description,
  canonicalPath,
  pageType,
  ogType = 'website',
  ogImage = '/og-image.jpg',
  noIndex = false,
  settings,
  services,
  testimonials,
  activeService,
  activePost,
  activeCity,
  breadcrumbs,
}) => {
  useEffect(() => {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://stavparta.cz';
    const normalizedPath = canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`;
    const canonicalUrl = `${origin}${normalizedPath}`;
    const resolvedOgImage = ogImage.startsWith('http')
      ? ogImage
      : `${origin}${ogImage.startsWith('/') ? ogImage : `/${ogImage}`}`;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    upsertLink('canonical', canonicalUrl);

    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', resolvedOgImage);

    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', resolvedOgImage);

    if (noIndex) {
      const existing = document.getElementById('stavparta-jsonld');
      if (existing) existing.remove();
      return;
    }

    const payload = buildSeoJsonLdPayload({
      origin,
      canonicalUrl,
      pageType,
      settings,
      services,
      testimonials,
      activeService,
      activePost,
      activeCity,
      breadcrumbs,
    });

    let scriptEl = document.getElementById('stavparta-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'stavparta-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(payload);
  }, [
    title,
    description,
    canonicalPath,
    pageType,
    ogType,
    ogImage,
    noIndex,
    settings,
    services,
    testimonials,
    activeService,
    activePost,
    activeCity,
    breadcrumbs,
  ]);

  return null;
};

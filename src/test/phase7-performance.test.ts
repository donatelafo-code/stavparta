import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  RESPONSIVE_IMAGE_SPECS,
  normalizeLegacyMediaUrl,
  resolveResponsiveImageSources,
} from '../shared/responsiveImages';

const rootDir = path.resolve(import.meta.dirname, '../..');

describe('Phase 7 Performance (Code-Splitting, Responsive Images, Lazy Loading, Video Preload)', () => {
  it('verifies all 12 images have multi-size WebP and AVIF assets under public/images', () => {
    let totalWebpBytes = 0;
    let totalAvifBytes = 0;

    for (const spec of Object.values(RESPONSIVE_IMAGE_SPECS)) {
      expect(spec.widths.length).toBe(3);
      for (const width of spec.widths) {
        const webpPath = path.join(rootDir, 'public/images', `${spec.baseName}-${width}.webp`);
        const avifPath = path.join(rootDir, 'public/images', `${spec.baseName}-${width}.avif`);
        expect(fs.existsSync(webpPath)).toBe(true);
        expect(fs.existsSync(avifPath)).toBe(true);
        totalWebpBytes += fs.statSync(webpPath).size;
        totalAvifBytes += fs.statSync(avifPath).size;
      }
    }

    // All 36 WebP variants combined must be substantially smaller than original 9.69 MB JPGs
    expect(totalWebpBytes).toBeLessThan(3_000_000);
    expect(totalAvifBytes).toBeLessThan(2_000_000);
  });

  it('resolves legacy /src/assets/images/*.jpg URLs cleanly to AVIF/WebP srcset with dimensions', () => {
    const resolved = resolveResponsiveImageSources(
      '/src/assets/images/hero_craft_construction_1793401118434.jpg'
    );
    expect(resolved.fallbackSrc).toBe('/images/hero_craft_construction_1793401118434-1376.webp');
    expect(resolved.webpSrcSet).toContain('480w');
    expect(resolved.webpSrcSet).toContain('960w');
    expect(resolved.webpSrcSet).toContain('1376w');
    expect(resolved.avifSrcSet).toContain('.avif 960w');
    expect(resolved.width).toBe(1376);
    expect(resolved.height).toBe(768);

    expect(
      normalizeLegacyMediaUrl('/src/assets/images/project_bathroom_tiles_1793401119494.jpg')
    ).toBe('/images/project_bathroom_tiles_1793401119494-800.webp');
  });

  it('uses React.lazy for heavy sections/modals and dynamic import() for jszip', () => {
    const appSource = fs.readFileSync(path.join(rootDir, 'src/App.tsx'), 'utf8');
    expect(appSource).toContain("lazy(() =>");
    expect(appSource).toContain("import('./components/AdminDashboard')");
    expect(appSource).toContain("import('./components/ServiceAreaMapSection')");
    expect(appSource).toContain("import('./components/CaseStudiesSection')");
    expect(appSource).toContain("import('./components/MaterialComparisonSection')");
    expect(appSource).toContain("import('./components/BlogSection')");

    const adminSource = fs.readFileSync(
      path.join(rootDir, 'src/components/AdminDashboard.tsx'),
      'utf8'
    );
    expect(adminSource).toContain("import('./QuotationGeneratorModal')");

    const exportSource = fs.readFileSync(path.join(rootDir, 'src/services/export.ts'), 'utf8');
    expect(exportSource).not.toMatch(/^import\s+JSZip\s+from\s+['"]jszip['"]/m);
    expect(exportSource).toContain("await import('jszip')");
  });

  it('configures video preload="none" and ResponsiveImage lazy-loading defaults', () => {
    const videoSource = fs.readFileSync(
      path.join(rootDir, 'src/components/SiteVideoPlayer.tsx'),
      'utf8'
    );
    expect(videoSource).toContain('preload="none"');
    expect(videoSource).toContain('playsInline');
    expect(videoSource).toContain('poster={video.posterUrl}');

    const imgComponentSource = fs.readFileSync(
      path.join(rootDir, 'src/components/ResponsiveImage.tsx'),
      'utf8'
    );
    expect(imgComponentSource).toContain("priority ? 'eager' : 'lazy'");
    expect(imgComponentSource).toContain("fetchPriority ?? (priority ? 'high' : undefined)");

    const heroSource = fs.readFileSync(path.join(rootDir, 'src/components/Hero.tsx'), 'utf8');
    expect(heroSource).toContain('<ResponsiveImage');
    expect(heroSource).toContain('priority');
  });
});

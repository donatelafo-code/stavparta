import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getFocusableElements,
  getNextWrapFocusElement,
  getPreferredScrollBehavior,
  isModalHiddenOrDisabled,
} from '../hooks/useModalAccessibility';

const rootDir = path.resolve(import.meta.dirname, '../..');

const readComponent = (relPath: string): string =>
  fs.readFileSync(path.join(rootDir, relPath), 'utf8');

describe('Phase 9 Accessibility, Contrast & Reduced Motion', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });

  it('respects prefers-reduced-motion in getPreferredScrollBehavior', () => {
    // Node environment without window falls back safely to smooth
    expect(getPreferredScrollBehavior()).toBe('smooth');

    // Reduced motion enabled -> returns 'auto'
    (globalThis as { window?: unknown }).window = {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    };
    expect(getPreferredScrollBehavior()).toBe('auto');

    // Reduced motion disabled -> returns 'smooth'
    (globalThis as { window?: unknown }).window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    };
    expect(getPreferredScrollBehavior()).toBe('smooth');
  });

  it('computes Tab and Shift+Tab wrap targets accurately in getNextWrapFocusElement', () => {
    const first = { id: 'first' } as unknown as HTMLElement;
    const middle = { id: 'middle' } as unknown as HTMLElement;
    const last = { id: 'last' } as unknown as HTMLElement;
    const list = [first, middle, last];

    expect(getNextWrapFocusElement([], first, false)).toBeNull();
    expect(getNextWrapFocusElement([first], first, false)).toBe(first);

    // Wraps forward from last -> first
    expect(getNextWrapFocusElement(list, last, false)).toBe(first);
    // Wraps backward from first -> last
    expect(getNextWrapFocusElement(list, first, true)).toBe(last);
    // Middle element lets native Tab proceed normally
    expect(getNextWrapFocusElement(list, middle, false)).toBeNull();
    expect(getNextWrapFocusElement(list, middle, true)).toBeNull();
    // Outside element enters first or last depending on shiftKey
    expect(getNextWrapFocusElement(list, null, false)).toBe(first);
    expect(getNextWrapFocusElement(list, null, true)).toBe(last);
  });

  it('filters hidden or disabled focusable elements with getFocusableElements', () => {
    const visibleBtn = {
      id: 'visible',
      hasAttribute: () => false,
      getAttribute: () => null,
      closest: () => null,
    } as unknown as HTMLElement;
    const disabledBtn = {
      id: 'disabled',
      hasAttribute: (attr: string) => attr === 'disabled',
      getAttribute: () => null,
      closest: () => null,
    } as unknown as HTMLElement;
    const hiddenChild = {
      id: 'hidden-child',
      hasAttribute: () => false,
      getAttribute: () => null,
      closest: () => ({ id: 'hidden-ancestor' }),
    } as unknown as HTMLElement;
    const displayNoneEl = {
      id: 'display-none',
      hasAttribute: () => false,
      getAttribute: () => null,
      closest: () => null,
    } as unknown as HTMLElement;

    (globalThis as { window?: unknown }).window = {
      getComputedStyle: (el: HTMLElement) => ({
        display: el === displayNoneEl ? 'none' : 'block',
        visibility: 'visible',
      }),
    };

    const container = {
      querySelectorAll: () => [visibleBtn, disabledBtn, hiddenChild, displayNoneEl],
    } as unknown as HTMLElement;

    expect(isModalHiddenOrDisabled(disabledBtn)).toBe(true);
    expect(isModalHiddenOrDisabled(hiddenChild)).toBe(true);
    expect(isModalHiddenOrDisabled(displayNoneEl)).toBe(true);
    expect(isModalHiddenOrDisabled(visibleBtn)).toBe(false);
    expect(getFocusableElements(container)).toEqual([visibleBtn]);
  });

  it('wires useModalAccessibility, role="dialog", aria-modal, and Esc/focus-trap across all modals', () => {
    const modalFiles = [
      'src/components/GdprModal.tsx',
      'src/components/TermsModal.tsx',
      'src/components/QuotationGeneratorModal.tsx',
      'src/components/ChatWidget.tsx',
      'src/components/ProjectsSection.tsx',
      'src/components/AdminDashboard.tsx',
    ];

    for (const file of modalFiles) {
      const src = readComponent(file);
      expect(src, `${file} should use useModalAccessibility`).toContain('useModalAccessibility(');
      expect(src, `${file} should have role="dialog"`).toContain('role="dialog"');
      expect(src, `${file} should have aria-modal="true"`).toContain('aria-modal="true"');
      expect(src, `${file} should declare aria-labelledby`).toContain('aria-labelledby=');
    }
  });

  it('implements full keyboard navigation and ARIA slider semantics on BeforeAfterSlider', () => {
    const src = readComponent('src/components/BeforeAfterSlider.tsx');
    expect(src).toContain('role="slider"');
    expect(src).toContain('aria-valuenow={roundedPosition}');
    expect(src).toContain('aria-valuemin={0}');
    expect(src).toContain('aria-valuemax={100}');
    expect(src).toContain('aria-valuetext=');
    expect(src).toContain("e.key === 'ArrowLeft'");
    expect(src).toContain("e.key === 'ArrowRight'");
    expect(src).toContain("e.key === 'Home'");
    expect(src).toContain("e.key === 'End'");
    expect(src).toContain("e.key === 'PageUp'");
    expect(src).toContain("e.key === 'PageDown'");
  });

  it('connects form inputs to labels and error alerts across public and admin forms', () => {
    const leadForm = readComponent('src/components/LeadFormSection.tsx');
    expect(leadForm).toContain('htmlFor="lead-name"');
    expect(leadForm).toContain('htmlFor="lead-email"');
    expect(leadForm).toContain('htmlFor="lead-phone"');
    expect(leadForm).toContain('htmlFor="lead-location"');
    expect(leadForm).toContain('htmlFor="lead-description"');
    expect(leadForm).toContain('htmlFor="lead-gdpr-consent"');
    expect(leadForm).toContain('role="alert"');

    const footer = readComponent('src/components/Footer.tsx');
    expect(footer).toContain('htmlFor="footer-newsletter-email"');
    expect(footer).toContain("aria-describedby={newsletterStatus === 'error' ? 'footer-newsletter-error' : undefined}");
    expect(footer).toContain('id="footer-newsletter-error"');
    expect(footer).toContain('role="alert"');

    const chat = readComponent('src/components/ChatWidget.tsx');
    expect(chat).toContain('htmlFor="chat-widget-input"');
    expect(chat).toContain('role="alert"');

    const calc = readComponent('src/components/PriceCalculatorSection.tsx');
    expect(calc).toContain('htmlFor="calc-large-format"');
    expect(calc).toContain('htmlFor="calc-apt-ceilings"');
    expect(calc).toContain('htmlFor="calc-apt-flooring"');
    expect(calc).toContain('role="group" aria-labelledby=');

    const admin = readComponent('src/components/AdminDashboard.tsx');
    expect(admin).toContain('htmlFor="admin-login-username"');
    expect(admin).toContain('htmlFor="admin-login-password"');
    expect(admin).toContain('htmlFor="admin-lead-search"');
    expect(admin).toContain('htmlFor="admin-lead-note-input"');
    expect(admin).toContain('Náhled přílohy:');
  });

  it('eliminates low-contrast white-on-orange buttons and enables reduced motion globally', () => {
    const mainSrc = readComponent('src/main.tsx');
    expect(mainSrc).toContain('MotionConfig reducedMotion="user"');

    const cssSrc = readComponent('src/index.css');
    expect(cssSrc).toContain('prefers-reduced-motion: reduce');
    expect(cssSrc).toContain(':focus-visible');

    const componentsDir = path.join(rootDir, 'src/components');
    const componentFiles = fs.readdirSync(componentsDir).filter((f) => f.endsWith('.tsx'));

    for (const file of componentFiles) {
      const src = fs.readFileSync(path.join(componentsDir, file), 'utf8');
      expect(src, `${file} must not use low-contrast bg-[#F07818]`).not.toContain('bg-[#F07818]');
      expect(src, `${file} must not use low-contrast #d9660e`).not.toContain('#d9660e');
      expect(src, `${file} should use getPreferredScrollBehavior instead of hardcoded smooth scroll`).not.toMatch(
        /behavior:\s*['"]smooth['"]/
      );
    }

    const appSrc = readComponent('src/App.tsx');
    expect(appSrc).not.toContain('bg-[#F07818]');
    expect(appSrc).not.toContain('#d9660e');
    expect(appSrc).toContain('getPreferredScrollBehavior');
  });
});

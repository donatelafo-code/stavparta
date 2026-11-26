import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ');

const modalStack: symbol[] = [];
let bodyScrollLockCount = 0;
let savedBodyOverflow = '';

export function isModalHiddenOrDisabled(el: HTMLElement): boolean {
  if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') {
    return true;
  }
  if (el.closest('[aria-hidden="true"], [hidden]')) {
    return true;
  }
  const style = window.getComputedStyle(el);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return true;
  }
  return false;
}

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const candidates = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return candidates.filter((el) => !isModalHiddenOrDisabled(el));
}

export function getNextWrapFocusElement(
  focusables: HTMLElement[],
  activeElement: Element | null,
  shiftKey: boolean
): HTMLElement | null {
  if (focusables.length === 0) return null;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (focusables.length === 1) {
    return first;
  }

  const currentIdx = activeElement ? focusables.indexOf(activeElement as HTMLElement) : -1;
  if (currentIdx === -1) {
    return shiftKey ? last : first;
  }

  if (shiftKey && currentIdx === 0) {
    return last;
  }
  if (!shiftKey && currentIdx === focusables.length - 1) {
    return first;
  }
  return null;
}

export function getPreferredScrollBehavior(): ScrollBehavior {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'smooth';
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export interface UseModalAccessibilityOptions {
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  lockBodyScroll?: boolean;
  trapFocus?: boolean;
}

export function useModalAccessibility({
  isOpen,
  onClose,
  containerRef,
  initialFocusRef,
  returnFocusRef,
  lockBodyScroll = true,
  trapFocus = true,
}: UseModalAccessibilityOptions): void {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const modalToken = Symbol('stavparta-modal');
    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    modalStack.push(modalToken);

    if (lockBodyScroll) {
      if (bodyScrollLockCount === 0) {
        savedBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      bodyScrollLockCount += 1;
    }

    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const active = document.activeElement;
      if (active && container.contains(active)) {
        return;
      }

      if (initialFocusRef?.current && !isModalHiddenOrDisabled(initialFocusRef.current)) {
        initialFocusRef.current.focus();
        return;
      }

      const focusables = getFocusableElements(container);
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        if (!container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
        }
        container.focus();
      }
    }, 0);

    const isTopModal = () => modalStack[modalStack.length - 1] === modalToken;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isTopModal()) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === 'Tab' && trapFocus) {
        const container = containerRef.current;
        if (!container) return;

        const focusables = getFocusableElements(container);
        if (focusables.length === 0) {
          event.preventDefault();
          container.focus();
          return;
        }

        const wrapTarget = getNextWrapFocusElement(
          focusables,
          document.activeElement,
          event.shiftKey
        );
        if (wrapTarget) {
          event.preventDefault();
          wrapTarget.focus();
        }
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!trapFocus || !isTopModal()) return;
      const container = containerRef.current;
      if (!container) return;
      const target = event.target;
      if (target instanceof Node && !container.contains(target)) {
        const focusables = getFocusableElements(container);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          container.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn);

      const idx = modalStack.lastIndexOf(modalToken);
      if (idx !== -1) {
        modalStack.splice(idx, 1);
      }

      if (lockBodyScroll) {
        bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);
        if (bodyScrollLockCount === 0) {
          document.body.style.overflow = savedBodyOverflow;
        }
      }

      const targetToRestore =
        returnFocusRef?.current && returnFocusRef.current.isConnected
          ? returnFocusRef.current
          : previouslyFocused;

      if (targetToRestore && targetToRestore.isConnected) {
        window.setTimeout(() => {
          if (targetToRestore.isConnected) {
            targetToRestore.focus();
          }
        }, 0);
      }
    };
  }, [isOpen, containerRef, initialFocusRef, returnFocusRef, lockBodyScroll, trapFocus]);
}

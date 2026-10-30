import "@testing-library/jest-dom/vitest";

// jsdom يبلّغ عن "en-US" افتراضيًا، و`getSavedLang()` يتبع لغة المتصفح.
// SOOQY سوق جزائري — نثبّت لغة المتصفح على العربية ليعكس الاختبار السوق الافتراضي.
Object.defineProperty(navigator, "language", {
  configurable: true,
  get: () => "ar-DZ",
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// jsdom لا يوفر IntersectionObserver/ResizeObserver — مطلوبان من embla-carousel (Carousel)
class IntersectionObserverStub {
  root: Element | null = null;
  rootMargin = "";
  thresholds: number[] = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: IntersectionObserverStub,
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: ResizeObserverStub,
});

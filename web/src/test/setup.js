import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn(), custom: vi.fn(), dismiss: vi.fn() },
  success: vi.fn(),
  error: vi.fn(),
  custom: vi.fn(),
  dismiss: vi.fn(),
}))

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {}
}

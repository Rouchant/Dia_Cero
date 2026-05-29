import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Limpia el DOM después de cada prueba para evitar interferencias
afterEach(() => {
  cleanup();
});

// Mock de window.matchMedia (no implementado en JSDOM por defecto)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Obsoleto
    removeListener: vi.fn(), // Obsoleto
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

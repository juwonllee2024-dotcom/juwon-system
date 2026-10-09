import type { JuwonSystemApi } from './system-api';

declare global {
  interface Window {
    juwonSystem: JuwonSystemApi;
  }
}

export {};

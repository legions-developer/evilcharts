"use client";

import { PROVIDERS, PROVIDER_STORAGE_KEY, type Provider } from "@/globals/constants/providers";
import { useSyncExternalStore } from "react";

// Shared pages (/docs, /docs/chart-config) belong to no provider, but the
// sidebar should keep showing the engine the reader was last in. That history
// lives outside React — a module singleton mirrored to localStorage — so it
// survives client-side navigation (the singleton) and hard reloads (storage)
// without setState-in-effect chains.

let lastProvider: Provider | null = null;
let restored = false;
const listeners = new Set<() => void>();

function readStorage(): Provider | null {
  try {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    return PROVIDERS.includes(stored as Provider) ? (stored as Provider) : null;
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Provider | null {
  if (!restored) {
    restored = true;
    lastProvider ??= readStorage();
  }
  return lastProvider;
}

// The server has no history; callers fall back to the default provider, and
// React reconciles the stored value in after hydration.
const getServerSnapshot = () => null;

export function rememberProvider(provider: Provider) {
  if (lastProvider === provider) return;
  lastProvider = provider;
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
  } catch {
    // Storage unavailable — in-session stickiness still works.
  }
  listeners.forEach((notify) => notify());
}

export function useLastProvider(): Provider | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

"use client";

import { useCallback, useSyncExternalStore } from "react";

const OPEN_STORAGE_KEY = "copilot-panel-open";
const DEFAULT_WIDTH_PERCENT = 28;
const DEFAULT_OPEN = true;

/**
 * Whether the copilot panel is showing, remembered between visits.
 *
 * Browser storage is treated as what it is — something outside React that can
 * change on its own and can refuse to work at all. Every read and write is
 * wrapped, because a private window or blocked site data would otherwise throw
 * and take the whole dashboard down.
 */

const subscribers = new Set<() => void>();

function notifySubscribers(): void {
  for (const notify of subscribers) {
    notify();
  }
}

function subscribe(notify: () => void): () => void {
  subscribers.add(notify);
  window.addEventListener("storage", notify);

  return () => {
    subscribers.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

function readOpenState(): boolean {
  try {
    const stored = window.localStorage.getItem(OPEN_STORAGE_KEY);
    return stored === null ? DEFAULT_OPEN : stored === "true";
  } catch {
    return DEFAULT_OPEN;
  }
}

/** The server has no storage to read, so it renders the default. */
function readServerOpenState(): boolean {
  return DEFAULT_OPEN;
}

function writeOpenState(isOpen: boolean): void {
  try {
    window.localStorage.setItem(OPEN_STORAGE_KEY, String(isOpen));
  } catch {
    // The preference simply will not persist.
  }
  notifySubscribers();
}

export function useCopilotPanel() {
  const isOpen = useSyncExternalStore(subscribe, readOpenState, readServerOpenState);

  const toggle = useCallback(() => {
    writeOpenState(!readOpenState());
  }, []);

  return { isOpen, toggle, defaultWidthPercent: DEFAULT_WIDTH_PERCENT };
}

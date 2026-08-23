"use client";

import { useCallback, useEffect, useState } from "react";

const OPEN_STORAGE_KEY = "copilot-panel-open";
const DEFAULT_WIDTH_PERCENT = 28;

/**
 * Open and closed state for the copilot side panel, remembered between visits.
 *
 * Reading and writing storage is wrapped because a browser can refuse it
 * outright — private windows, blocked site data — and a thrown error here would
 * take the whole dashboard down.
 */
export function useCopilotPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(OPEN_STORAGE_KEY);
      if (stored !== null) {
        setIsOpen(stored === "true");
      }
    } catch {
      // Storage unavailable — fall back to the default.
    }
    setHasLoadedPreference(true);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((currentlyOpen) => {
      const nextOpen = !currentlyOpen;
      try {
        window.localStorage.setItem(OPEN_STORAGE_KEY, String(nextOpen));
      } catch {
        // Preference simply will not persist.
      }
      return nextOpen;
    });
  }, []);

  return {
    isOpen,
    toggle,
    hasLoadedPreference,
    defaultWidthPercent: DEFAULT_WIDTH_PERCENT,
  };
}

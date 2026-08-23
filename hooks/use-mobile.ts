"use client";

import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Whether the viewport is phone-sized.
 *
 * Rewritten from the version shadcn ships, which set state inside an effect and
 * so both tripped React's cascading-render rule and briefly reported the wrong
 * answer on first paint. A media query is external state, so it is read as
 * external state.
 */

const mobileQuery = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

function subscribe(notify: () => void): () => void {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

function readIsMobile(): boolean {
  return window.matchMedia(mobileQuery).matches;
}

/** The server has no viewport, so it assumes desktop. */
function readServerIsMobile(): boolean {
  return false;
}

export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, readIsMobile, readServerIsMobile);
}

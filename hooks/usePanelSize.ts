"use client";

import { useCallback, useState, type PointerEvent as ReactPointerEvent } from "react";

interface PanelSize {
  width: number;
  height: number;
}

const SMALLEST = { width: 320, height: 280 };
const DEFAULT = { width: 416, height: 608 };

function clamp(value: number, lowest: number, highest: number): number {
  return Math.min(Math.max(value, lowest), highest);
}

/**
 * Lets a floating panel be resized by dragging a corner.
 *
 * The copilot covers whatever it is talking about, so being able to shrink it
 * matters as much as being able to move it — a long reply needs height, and
 * reading the table underneath needs it out of the way.
 *
 * Size is held for the session rather than saved, for the same reason as
 * position: the right size depends on what you are doing right now.
 */
export function usePanelSize() {
  const [size, setSize] = useState<PanelSize>(DEFAULT);
  const [isResizing, setIsResizing] = useState(false);

  const startResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    setIsResizing(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.stopPropagation();
  }, []);

  /**
   * The panel is anchored bottom-right, so the handle sits at its top-left:
   * dragging left widens it, and dragging up makes it taller. Measuring from
   * the anchored edges keeps the panel still while you drag, instead of
   * sliding away from the pointer.
   */
  const continueResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!isResizing) {
        return;
      }

      const panel = event.currentTarget.parentElement;
      if (!panel) {
        return;
      }

      const bounds = panel.getBoundingClientRect();

      setSize({
        width: clamp(bounds.right - event.clientX, SMALLEST.width, window.innerWidth - 32),
        height: clamp(bounds.bottom - event.clientY, SMALLEST.height, window.innerHeight - 32),
      });
    },
    [isResizing]
  );

  const endResize = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    setIsResizing(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  const resetSize = useCallback(() => setSize(DEFAULT), []);

  const isDefaultSize = size.width === DEFAULT.width && size.height === DEFAULT.height;

  return {
    size,
    isResizing,
    isDefaultSize,
    resetSize,
    resizeHandleProps: {
      onPointerDown: startResize,
      onPointerMove: continueResize,
      onPointerUp: endResize,
      onPointerCancel: endResize,
    },
  };
}

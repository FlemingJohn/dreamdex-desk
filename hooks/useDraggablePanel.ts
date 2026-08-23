"use client";

import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

interface PanelPosition {
  left: number;
  top: number;
}

function clamp(value: number, lowest: number, highest: number): number {
  return Math.min(Math.max(value, lowest), highest);
}

/**
 * Lets a floating panel be dragged around by a handle.
 *
 * Position is held for the session rather than saved. Where you park the
 * copilot depends on what you are reading underneath it, so it should start
 * back in its corner next time rather than somewhere you left it days ago.
 *
 * The panel is kept inside the viewport while dragging, so it can never be
 * pushed somewhere you cannot reach it.
 */
export function useDraggablePanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const grabOffset = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const startDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }

    /**
     * Leave the header's own controls alone.
     *
     * Capturing the pointer below routes every later pointer event to the
     * header, so a press that began on a button would never produce a click on
     * it — the button would look dead. Anything interactive has to opt out of
     * dragging before the capture happens.
     */
    if ((event.target as HTMLElement).closest("button, a, input")) {
      return;
    }

    const bounds = panel.getBoundingClientRect();
    grabOffset.current = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };

    setPosition({ left: bounds.left, top: bounds.top });
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const continueDrag = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const panel = panelRef.current;
      if (!isDragging || !panel) {
        return;
      }

      setPosition({
        left: clamp(
          event.clientX - grabOffset.current.x,
          0,
          window.innerWidth - panel.offsetWidth
        ),
        top: clamp(
          event.clientY - grabOffset.current.y,
          0,
          window.innerHeight - panel.offsetHeight
        ),
      });
    },
    [isDragging]
  );

  const endDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  /** Put it back where it started. */
  const resetPosition = useCallback(() => setPosition(null), []);

  return {
    panelRef,
    position,
    isDragging,
    resetPosition,
    dragHandleProps: {
      onPointerDown: startDrag,
      onPointerMove: continueDrag,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  };
}

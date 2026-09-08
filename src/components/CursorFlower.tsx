"use client";

import { useEffect, useRef } from "react";

const TARGET = "[data-flower-target]";

/**
 * Custom pointer for painting thumbnails (interaction spec 01): the native
 * cursor is hidden over a card image and a flower follows the pointer instead.
 *
 * Desktop only — activated behind `(pointer: fine)` so touch devices, where
 * there is no hover, are untouched. The `data-flower-cursor` attribute is set
 * on <html> from here rather than in CSS, so `cursor: none` only ever applies
 * once this component is actually running: if the JS fails or never mounts,
 * visitors keep their normal cursor instead of losing it entirely.
 */
export function CursorFlower() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.documentElement.dataset.flowerCursor = "on";

    let frame = 0;
    let visible = false;
    let x = 0;
    let y = 0;

    const draw = () => {
      frame = 0;
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const setVisible = (next: boolean) => {
      if (next === visible) return;
      visible = next;
      root.dataset.visible = next ? "true" : "false";
    };

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      setVisible(Boolean((e.target as Element | null)?.closest?.(TARGET)));
      if (!frame) frame = requestAnimationFrame(draw);
    };

    // Scrolling moves the page under a stationary pointer, so re-test what is
    // beneath it — otherwise the flower can stick after a wheel scroll.
    const onScroll = () => {
      setVisible(Boolean(document.elementFromPoint(x, y)?.closest(TARGET)));
    };

    const hide = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("blur", hide);
    window.addEventListener("pointerdown", hide);
    document.documentElement.addEventListener("pointerleave", hide);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("blur", hide);
      window.removeEventListener("pointerdown", hide);
      document.documentElement.removeEventListener("pointerleave", hide);
      if (frame) cancelAnimationFrame(frame);
      delete document.documentElement.dataset.flowerCursor;
    };
  }, []);

  return (
    <div ref={rootRef} className="cursor-flower" data-visible="false" aria-hidden="true">
      <span className="cursor-flower__inner">
        <span className="cursor-flower__spin">
          <svg
            viewBox="0 0 512 512"
            fill="none"
            stroke="currentColor"
            strokeWidth={26}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* five petals */}
            <circle cx="256" cy="111" r="105" />
            <circle cx="393" cy="211" r="105" />
            <circle cx="341" cy="371" r="105" />
            <circle cx="171" cy="371" r="105" />
            <circle cx="119" cy="211" r="105" />
            {/* centre */}
            <circle cx="256" cy="256" r="58" />
          </svg>
        </span>
      </span>
    </div>
  );
}

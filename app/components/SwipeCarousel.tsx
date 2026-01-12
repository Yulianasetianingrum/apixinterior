"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  /** Scroll distance relative to container width (default 0.85) */
  scrollFactor?: number;
  /** Wrap each child item to enforce snap + non-shrinking layout (default true) */
  wrapItems?: boolean;
  /** Optional class applied to each wrapped item */
  itemClassName?: string;
  /** Optional style applied to each wrapped item */
  itemStyle?: React.CSSProperties;
  /** Optional style override for navigation arrows */
  arrowBtnStyle?: React.CSSProperties;
};

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M15 18l-6-6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M9 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SwipeCarousel({
  children,
  className,
  style,
  ariaLabel = "Carousel",
  scrollFactor = 0.85,
  wrapItems = true,
  itemClassName,
  itemStyle,
  arrowBtnStyle,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const items = useMemo(() => {
    if (!wrapItems) return children;
    const arr = React.Children.toArray(children);
    return arr.map((child, idx) => (
      <div
        // eslint-disable-next-line react/no-array-index-key
        key={(child as any)?.key ?? idx}
        className={itemClassName}
        style={{
          flex: "0 0 auto",
          scrollSnapAlign: "start",
          scrollSnapStop: "always",
          ...(itemStyle ?? {}),
        }}
        data-apix-carousel-item
      >
        {child}
      </div>
    ));
  }, [children, wrapItems, itemClassName, itemStyle]);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const left = el.scrollLeft;
    setCanLeft(left > 2);
    setCanRight(max - left > 2);
  };

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;

    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    // images may load later and change widths
    const id = window.setTimeout(update, 250);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.clearTimeout(id);
    };
  }, []);

  const scrollByPage = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * scrollFactor) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  const btnBase: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 44,
    height: 44,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    border: "1px solid #d4af37",
    background: "rgba(11, 31, 59, 0.92)",
    color: "#d4af37",
    boxShadow: "0 10px 22px rgba(0,0,0,.18)",
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    zIndex: 2,
    ...(arrowBtnStyle ?? {}),
  };

  const baseScrollerStyle: React.CSSProperties = {
    display: "flex",
    gap: 16,
    overflowX: "auto",
    overflowY: "hidden",
    WebkitOverflowScrolling: "touch",
    scrollSnapType: "x mandatory",
    scrollPaddingLeft: 6,
    scrollPaddingRight: 6,
    padding: "6px 6px 18px",
    overscrollBehaviorX: "contain",
  };

  return (
    <div style={{ position: "relative" }} aria-label={ariaLabel}>
      <div
        ref={scrollerRef}
        data-apix-carousel
        className={className}
        style={{
          ...baseScrollerStyle,
          ...(style ?? {}),
        }}
      >
        {items}
      </div>

      {canLeft ? (
        <button
          type="button"
          aria-label="Scroll kiri"
          onClick={() => scrollByPage("left")}
          style={{ ...btnBase, left: 10 }}
        >
          <ChevronLeftIcon />
        </button>
      ) : null}

      {canRight ? (
        <button
          type="button"
          aria-label="Scroll kanan"
          onClick={() => scrollByPage("right")}
          style={{ ...btnBase, right: 10 }}
        >
          <ChevronRightIcon />
        </button>
      ) : null}

      <style jsx>{`
        div[data-apix-carousel] {
          scrollbar-width: none;
        }
        div[data-apix-carousel]::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
      `}</style>
    </div>
  );
}

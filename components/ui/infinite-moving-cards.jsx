"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState, useCallback } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className,
}) => {
  const containerRef = React.useRef(null);
  const scrollerRef = React.useRef(null);

  const [start, setStart] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const addAnimation = React.useCallback(() => {
    if (containerRef.current && scrollerRef.current) {
      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      if (direction === "left") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "forwards",
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse",
        );
      }

      if (speed === "fast") {
        containerRef.current.style.setProperty("--animation-duration", "20s");
      } else if (speed === "normal") {
        containerRef.current.style.setProperty("--animation-duration", "40s");
      } else {
        containerRef.current.style.setProperty("--animation-duration", "80s");
      }

      setStart(true);
    }
  }, [direction, speed]);

  useEffect(() => {
    addAnimation();
  }, [addAnimation]);

  // Toggle pause on touch/click for mobile
  const handleTogglePause = useCallback(() => {
    if (!pauseOnHover) return;
    setIsPaused(prev => {
      const newState = !prev;
      scrollerRef.current?.style.setProperty(
        "animation-play-state",
        newState ? "paused" : "running"
      );
      return newState;
    });
  }, [pauseOnHover]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 w-full max-w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]",
        className,
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex w-max min-w-full shrink-0 flex-nowrap gap-4 py-4",
          start && "animate-scroll",
        )}
        onClick={handleTogglePause}
        onTouchEnd={handleTogglePause}
        onMouseEnter={
          pauseOnHover
            ? () => {
                setIsPaused(true);
                scrollerRef.current?.style.setProperty("animation-play-state", "paused");
              }
            : undefined
        }
        onMouseLeave={
          pauseOnHover
            ? () => {
                setIsPaused(false);
                scrollerRef.current?.style.setProperty("animation-play-state", "running");
              }
            : undefined
        }
      >
        {items.map((item) => (
          <li
            className="relative w-[280px] sm:w-[350px] max-w-full shrink-0 rounded-2xl border border-[var(--brand-primary)]/20 bg-[var(--card)] px-5 sm:px-8 py-4 sm:py-6 md:w-[450px] dark:border-[var(--brand-accent)]/30 dark:bg-[var(--brand-primary)]/90 shadow-sm"
            key={item.name}
          >
            <blockquote>
              <div
                aria-hidden="true"
                className="user-select-none pointer-events-none absolute -top-0.5 -left-0.5 -z-1 h-[calc(100%_+_4px)] w-[calc(100%_+_4px)]"
              ></div>
              <span className="relative z-20 text-xs sm:text-sm leading-[1.6] font-normal text-[var(--brand-primary)] dark:text-[var(--brand-light)]">
                {item.quote}
              </span>
              <div className="relative z-20 mt-4 sm:mt-6 flex flex-row items-center">
                <span className="flex flex-col gap-1">
                  <span className="text-xs sm:text-sm leading-[1.6] font-semibold text-[var(--brand-primary)]/80 dark:text-[var(--brand-light)]/80">
                    {item.name}
                  </span>
                  <span className="text-xs sm:text-sm leading-[1.6] font-normal text-[var(--brand-primary)]/60 dark:text-[var(--brand-light)]/60">
                    {item.title}
                  </span>
                </span>
              </div>
            </blockquote>
          </li>
        ))}
      </ul>
    </div>
  );
};

"use client";

import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Impactful texts for the gallery based on VulnIQ thesis and landing page content
const galleryItems = [
  {
    image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1260&h=750&fit=crop",
    title: "Agentic RAG",
    description: "LLMs act as central controllers orchestrating reasoning and tool interaction",
  },
  {
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1260&h=750&fit=crop",
    title: "Zero Hallucinations",
    description: "Knowledge-grounded fixes eliminate unreliable or fabricated remediation suggestions",
  },
  {
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1260&h=750&fit=crop",
    title: "Security Knowledge",
    description: "RAG retrieves best-practice guidelines, relevant code snippets, and historical fixes",
  },
  {
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1260&h=750&fit=crop",
    title: "Autonomous Agents",
    description: "Multi-agent pipeline: Reviewer, Fixer, Tester, and Report agents working in concert",
  },
  {
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1260&h=750&fit=crop",
    title: "Context-Aware",
    description: "Specialized retrieval methods yield substantial improvements over baselines",
  },
  {
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1260&h=750&fit=crop",
    title: "Your Documentation",
    description: "Every fix is grounded in your own security policies and coding standards",
  },
  {
    image: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=1260&h=750&fit=crop",
    title: "Verified Fixes",
    description: "Automated testing validates each remediation before deployment",
  },
  {
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1260&h=750&fit=crop",
    title: "Modern APR",
    description: "A crucial step toward reliable, high-quality automated program repair",
  },
];

const ThreeDHoverGallery = ({
  items = galleryItems,
  itemWidth = 12,
  itemHeight = 20,
  gap = 1.2,
  perspective = 50,
  hoverScale = 15,
  transitionDuration = 1.25,
  backgroundColor,
  grayscaleStrength = 1,
  brightnessLevel = 0.5,
  activeWidth = 45,
  rotationAngle = 35,
  zDepth = 10,
  enableKeyboardNavigation = true,
  autoPlay = false,
  autoPlayDelay = 3000,
  className,
  style,
  onImageClick,
  onImageHover,
  onImageFocus,
}) => {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [focusedIndex, setFocusedIndex] = useState(null);
  const autoPlayRef = useRef(null);

  // Effect for auto-play functionality
  useEffect(() => {
    if (autoPlay && items.length > 0) {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
      autoPlayRef.current = setInterval(() => {
        setActiveIndex((prev) => {
          const nextIndex = prev === null ? 0 : (prev + 1) % items.length;
          return nextIndex;
        });
      }, autoPlayDelay);

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
    if (!autoPlay && autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  }, [autoPlay, autoPlayDelay, items.length]);

  const handleImageClick = (index, item) => {
    setActiveIndex(activeIndex === index ? null : index);
    onImageClick?.(index, item);
  };

  const handleImageHover = (index, item) => {
    if (!autoPlay) {
      setActiveIndex(index);
    }
    onImageHover?.(index, item);
  };

  const handleImageLeave = () => {
    if (!autoPlay) {
      setActiveIndex(null);
    }
  };

  const handleImageFocus = (index, item) => {
    setFocusedIndex(index);
    onImageFocus?.(index, item);
  };

  const handleKeyDown = (event, index) => {
    if (!enableKeyboardNavigation) return;

    switch (event.key) {
      case "Enter":
      case " ":
        event.preventDefault();
        handleImageClick(index, items[index]);
        break;
      case "ArrowLeft":
        event.preventDefault();
        const prevIndex = index > 0 ? index - 1 : items.length - 1;
        containerRef.current?.children[prevIndex]?.focus();
        break;
      case "ArrowRight":
        event.preventDefault();
        const nextIndex = index < items.length - 1 ? index + 1 : 0;
        containerRef.current?.children[nextIndex]?.focus();
        break;
    }
  };

  const getItemStyle = (index) => {
    const isActive = activeIndex === index;
    const isFocused = focusedIndex === index;
    const baseWidthPx = 10;

    return {
      width: isActive
        ? `${activeWidth}vw`
        : `calc(${itemWidth}vw + ${baseWidthPx}px)`,
      height: `calc(${itemHeight}vw + ${itemHeight}vh)`,
      backgroundImage: `url(${items[index].image})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundColor,
      cursor: "pointer",
      filter:
        isActive || isFocused
          ? "inherit"
          : `grayscale(${grayscaleStrength}) brightness(${brightnessLevel})`,
      transform: isActive
        ? `translateZ(calc(${hoverScale}vw + ${hoverScale}vh))`
        : "none",
      transition: `transform ${transitionDuration}s cubic-bezier(.1, .7, 0, 1), filter 3s cubic-bezier(.1, .7, 0, 1), width ${transitionDuration}s cubic-bezier(.1, .7, 0, 1)`,
      willChange: "transform, filter, width",
      zIndex: isActive ? 100 : "auto",
      margin: isActive ? "0 0.45vw" : "0",
      outline: isFocused ? "2px solid #3b82f6" : "none",
      outlineOffset: "2px",
      borderRadius: "0.5rem",
    };
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen w-full overflow-hidden bg-background",
        className
      )}
      style={backgroundColor ? { backgroundColor, ...style } : style}
    >
      <div
        ref={containerRef}
        className="flex justify-center items-center w-full"
        style={{
          perspective: `calc(${perspective}vw + ${perspective}vh)`,
          gap: `${gap}rem`,
        }}
      >
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <div
              key={index}
              className="relative will-change-transform rounded-lg shadow-lg overflow-hidden"
              style={getItemStyle(index)}
              tabIndex={enableKeyboardNavigation ? 0 : -1}
              onClick={() => handleImageClick(index, item)}
              onMouseEnter={() => handleImageHover(index, item)}
              onMouseLeave={handleImageLeave}
              onFocus={() => handleImageFocus(index, item)}
              onBlur={() => setFocusedIndex(null)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              role="button"
              aria-label={`${item.title}: ${item.description}`}
              aria-pressed={activeIndex === index}
            >
              {/* Text overlay - only visible when active */}
              <div
                className={cn(
                  "absolute inset-0 flex flex-col justify-end p-4 sm:p-6",
                  "bg-gradient-to-t from-black/80 via-black/40 to-transparent",
                  "transition-opacity duration-700 ease-out",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              >
                <div
                  className={cn(
                    "transition-all duration-700 ease-out",
                    isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  )}
                  style={{ transitionDelay: isActive ? "150ms" : "0ms" }}
                >
                  <h3 className="text-white font-bold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 drop-shadow-lg">
                    {item.title}
                  </h3>
                </div>
                <div
                  className={cn(
                    "transition-all duration-700 ease-out",
                    isActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                  )}
                  style={{ transitionDelay: isActive ? "250ms" : "0ms" }}
                >
                  <p className="text-white/90 text-xs sm:text-sm md:text-base leading-relaxed drop-shadow-md line-clamp-3">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ThreeDHoverGallery;

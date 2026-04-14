"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';

const layerBase = "absolute inset-0 pointer-events-none";

export function CTASection({
                             title,
                             buttons,
                             className
                           }) {
  const t = useTranslations('cta');
  const resolvedTitle = title ?? t('title');
  const resolvedButtons = buttons ?? [
    {
      href: "/login",
      text: t('button'),
      variant: "default",
    },
  ];
  const [hovered, setHovered] = useState(false);
  const layerRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const animRef = useRef(null);
  const startTimeRef = useRef(null);
  const prevOpacities = useRef([0.35, 0.25, 0.15, 0.1]);

  const durations = [800, 1400, 2000, 2600];

  useEffect(() => {
    const targets = hovered ? [1, 1, 1, 1] : [0.35, 0.25, 0.15, 0.1];
    const startOpacities = prevOpacities.current.slice();
    startTimeRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      let allDone = true;

      layerRefs.forEach((ref, i) => {
        if (!ref.current) return;
        const progress = Math.min(elapsed / durations[i], 1);
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const current = startOpacities[i] + (targets[i] - startOpacities[i]) * eased;
        ref.current.style.opacity = current;
        prevOpacities.current[i] = current;
        if (progress < 1) allDone = false;
      });

      if (!allDone) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [hovered]);

  return (
      <section
          className={cn("relative overflow-hidden py-24 sm:py-32 lg:py-40 px-4", className)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
      >
        <div className="max-w-7xl relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
          <h2 className="max-w-[640px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
            {resolvedTitle}
          </h2>
          {resolvedButtons !== false && resolvedButtons.length > 0 && (
              <div className="flex justify-center gap-4">
                {resolvedButtons.map((button, index) => (
                    <Button key={index} variant={button.variant || "default"} size="lg" asChild>
                      <a href={button.href}>
                        {button.icon}
                        {button.text}
                        {button.iconRight}
                      </a>
                    </Button>
                ))}
              </div>
          )}
        </div>

        {/* Default subtle glow — always visible */}
        <div
            className={layerBase}
            style={{
              background: 'radial-gradient(80% 90% at 50% 110%, rgba(40, 130, 190, 0.25) 0%, transparent 100%)',
            }}
        />

        {/* Hover layers — JS-animated to bypass prefers-reduced-motion */}
        <div
            ref={layerRefs[0]}
            className={layerBase}
            style={{
              background: 'radial-gradient(70% 80% at 50% 110%, rgba(40, 130, 190, 0.4) 0%, transparent 100%)',
              opacity: 0.35,
            }}
        />
        <div
            ref={layerRefs[1]}
            className={layerBase}
            style={{
              background: 'radial-gradient(85% 95% at 50% 110%, rgba(35, 115, 175, 0.3) 0%, transparent 100%)',
              opacity: 0.25,
            }}
        />
        <div
            ref={layerRefs[2]}
            className={layerBase}
            style={{
              background: 'radial-gradient(95% 110% at 50% 110%, rgba(30, 100, 160, 0.22) 0%, transparent 100%)',
              opacity: 0.15,
            }}
        />
        <div
            ref={layerRefs[3]}
            className={layerBase}
            style={{
              background: 'radial-gradient(100% 120% at 50% 110%, rgba(25, 85, 140, 0.15) 0%, transparent 100%)',
              opacity: 0.1,
            }}
        />
      </section>
  );
}


export default CTASection;

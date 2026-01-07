"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Glow from "@/components/ui/glow";
import { Section } from "@/components/ui/section";
import { useState, useEffect } from "react";

// Check if device is mobile/tablet
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

export function CTASection({
  title = "Start securing",
  buttons = [
    {
      href: "/login",
      text: "Get Started",
      variant: "default",
    },
  ],
  className
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile and set up auto-pulse
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isTouchDevice() || window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-pulse animation on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const interval = setInterval(() => {
      setIsHovered(true);
      setTimeout(() => setIsHovered(false), 1500);
    }, 3000);
    
    // Start with pulse
    setIsHovered(true);
    setTimeout(() => setIsHovered(false), 1500);
    
    return () => clearInterval(interval);
  }, [isMobile]);

  return (
    <Section 
      className={cn("relative overflow-visible mt-16 sm:mt-24 lg:mt-32", className)}
      onMouseEnter={() => !isMobile && setIsHovered(true)}
      onMouseLeave={() => !isMobile && setIsHovered(false)}
    >
      <div className="max-w-7xl relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="max-w-[640px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          {title}
        </h2>
        {buttons !== false && buttons.length > 0 && (
          <div className="flex justify-center gap-4">
            {buttons.map((button, index) => (
              <Button
                key={index}
                variant={button.variant || "default"}
                size="lg"
                asChild
              >
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
      <div 
        className="absolute top-0 left-0 h-full w-full pointer-events-none"
        style={{
          transform: isHovered ? 'translateY(-2rem)' : 'translateY(1rem)',
          transition: 'transform 1s ease-out'
        }}
      >
        <Glow variant="bottom" />
      </div>
    </Section>
  );
}


export default CTASection;
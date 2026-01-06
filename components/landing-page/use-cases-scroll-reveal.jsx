"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { GraduationCap, Rocket, BookOpen, Building2, Users } from "lucide-react";

const defaultTitleClass = "text-sm sm:text-base md:text-lg font-semibold mb-0.5 sm:mb-1 text-foreground transition-opacity duration-300";
const defaultDescriptionClass = "text-xs sm:text-sm font-medium text-muted-foreground max-w-[350px] leading-[140%] transition-opacity duration-300";

const useCasesData = [
  {
    number: "01",
    title: "Security learners",
    description: "Hands-on insight with real vulnerabilities. Four agents guide you through detection, fixes, testing, and documentation.",
    visual: {
      icon: BookOpen,
      title: "Guided learning",
      subtitle: "Step-by-step remediation",
      color: "from-cyan-500 to-blue-600",
    },
  },
  {
    number: "02",
    title: "Startups",
    description: "Strong security without a dedicated team. Import code, run the workflow, ship fixes fast.",
    visual: {
      icon: Rocket,
      title: "Move fast",
      subtitle: "Security at startup speed",
      color: "from-emerald-500 to-teal-600",
    },
  },
  {
    number: "03",
    title: "Universities",
    description: "Connect theory with practice. Students learn real remediation with curriculum-aligned prompts.",
    visual: {
      icon: GraduationCap,
      title: "Academic focus",
      subtitle: "Theory meets practice",
      color: "from-violet-500 to-purple-600",
    },
  },
  {
    number: "04",
    title: "Open source",
    description: "Transparent, community-driven security. Shared knowledge bases produce trustworthy fixes.",
    visual: {
      icon: Users,
      title: "Community driven",
      subtitle: "Transparent improvements",
      color: "from-orange-500 to-rose-600",
    },
  },
  {
    number: "05",
    title: "Enterprise teams",
    description: "Scale security across large codebases with specialized prompts and compliance tracking.",
    visual: {
      icon: Building2,
      title: "Enterprise scale",
      subtitle: "Compliant & repeatable",
      color: "from-slate-500 to-zinc-700",
    },
  },
];

const getBarPercentageHeight = (scrollProgress, thresholdStart, thresholdEnd) => {
  if (scrollProgress < thresholdStart) {
    return 0;
  }
  if (scrollProgress > thresholdEnd) {
    return 100;
  }
  return ((scrollProgress - thresholdStart) / (thresholdEnd - thresholdStart)) * 100;
};

const PointItem = ({
  number,
  title,
  description,
  thresholdStart,
  thresholdEnd,
  scrollProgress,
}) => {
  const barHeightPercentage = getBarPercentageHeight(scrollProgress, thresholdStart, thresholdEnd);
  const isActive = barHeightPercentage > 0;

  return (
    <div className="flex flex-col w-full">
      <div className="w-full">
        <h3 className={cn(
          "text-lg sm:text-xl md:text-2xl font-bold mb-1 ml-2 sm:ml-4 transition-opacity duration-300",
          isActive ? "opacity-100 text-foreground" : "opacity-40 text-muted-foreground"
        )}>
          {number}
        </h3>
      </div>
      <div className="w-full flex relative left-[8px] sm:left-[12px]">
        <div className="w-[30px] sm:w-[50px] flex items-start justify-center relative">
          <div className="h-full w-[2px] bg-foreground/10 absolute top-0 left-[50%] -translate-x-1/2" />
          <div
            className="w-[2px] bg-[var(--brand-accent)] absolute top-0 left-[50%] -translate-x-1/2 transition-all duration-150"
            style={{ height: `${barHeightPercentage}%` }}
          />
        </div>
        <div className="flex-1 pl-2 sm:pl-3 pb-3 sm:pb-6">
          <h3 className={cn(defaultTitleClass, isActive ? "opacity-100" : "opacity-40")}>{title}</h3>
          <p className={cn(defaultDescriptionClass, isActive ? "opacity-100" : "opacity-40")}>{description}</p>
        </div>
      </div>
    </div>
  );
};

const VisualCard = ({ visual, isActive }) => {
  const Icon = visual.icon;
  return (
    <div className={cn(
      "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
      isActive ? "opacity-100" : "opacity-0"
    )}>
      <div className={cn(
        "w-full h-full rounded-2xl bg-gradient-to-br flex flex-col items-center justify-center gap-6 p-8",
        visual.color
      )}>
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-12 h-12 md:w-16 md:h-16 text-white" />
        </div>
        <div className="text-center">
          <h4 className="text-2xl md:text-3xl font-bold text-white mb-2">{visual.title}</h4>
          <p className="text-white/80 text-lg">{visual.subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export function UseCasesScrollReveal({ className }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const viewportHeight = window.innerHeight;
    const sectionRect = containerRef.current.getBoundingClientRect();
    const sectionHeight = containerRef.current.offsetHeight;
    
    const startOffset = viewportHeight * 0.3;
    const scrollableDistance = sectionHeight - viewportHeight;
    
    if (scrollableDistance <= 0) {
      setScrollProgress(0);
      return;
    }
    
    const scrolledAmount = -sectionRect.top + startOffset;
    
    if (scrolledAmount <= 0) {
      setScrollProgress(0);
    } else if (scrolledAmount >= scrollableDistance) {
      setScrollProgress(1);
    } else {
      setScrollProgress(scrolledAmount / scrollableDistance);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const totalItems = useCasesData.length;
  const thresholdStep = 1 / totalItems;

  // Determine which visual to show
  const activeIndex = Math.min(Math.floor(scrollProgress * totalItems), totalItems - 1);

  return (
    <section 
      className={cn("relative bg-background", className)} 
      ref={containerRef} 
      style={{ height: "300vh" }}
    >
      {/* Sticky container that stays in view */}
      <div className="sticky top-0 min-h-screen flex items-center z-10 py-8 md:py-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-16 xl:gap-24 w-full items-center">
            {/* Left side - Timeline */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center">
              {/* Section Header */}
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-1">
                  Who benefits from VulnIQ?
                </h2>
                <p className="text-muted-foreground text-xs sm:text-sm max-w-sm">
                  From learners to enterprises, VulnIQ adapts to your workflow.
                </p>
              </div>

              {/* Timeline Items */}
              <div className="space-y-1">
                {useCasesData.map((item, index) => (
                  <PointItem
                    key={item.number}
                    number={item.number}
                    title={item.title}
                    description={item.description}
                    thresholdStart={index * thresholdStep}
                    thresholdEnd={(index + 1) * thresholdStep}
                    scrollProgress={scrollProgress}
                  />
                ))}
              </div>
            </div>

            {/* Right side - Visual content */}
            <div className="hidden lg:block w-1/2 h-[60vh] relative">
              {useCasesData.map((item, index) => (
                <VisualCard
                  key={item.number}
                  visual={item.visual}
                  isActive={activeIndex === index}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default UseCasesScrollReveal;

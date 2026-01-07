"use client";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const glowVariants = cva(
  "pointer-events-none absolute left-1/2 -translate-x-1/2 w-full",
  {
    variants: {
      variant: {
        top: "top-0",
        above: "-top-[200px]",
        center: "top-1/2 -translate-y-1/2",
        bottom: "bottom-0",
        below: "-bottom-[200px]",
      },
    },
    defaultVariants: {
      variant: "top",
    },
  }
);

export default function Glow({ variant = "top", className }) {
  return (
    <div className={cn(glowVariants({ variant }), className)}>
      <div
        className="mx-auto h-[400px] w-full max-w-[1200px]"
        style={{
          background:
            "conic-gradient(from 230.29deg at 51.63% 52.16%, var(--brand-accent) 0deg, var(--brand-primary) 67.5deg, var(--brand-dark) 198.75deg, var(--brand-accent) 251.25deg, var(--brand-primary) 301.88deg, var(--brand-accent) 360deg)",
          filter: "blur(128px)",
          opacity: 0.5,
        }}
      />
    </div>
  );
}

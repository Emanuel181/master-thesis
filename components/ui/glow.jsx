import { cva } from "class-variance-authority";
import React from "react";

import { cn } from "@/lib/utils";

const glowVariants = cva("absolute w-full", {
  variants: {
    variant: {
      top: "top-0",
      above: "-top-[128px]",
      bottom: "bottom-0",
      below: "-bottom-[128px]",
      center: "top-[50%]",
    },
  },
  defaultVariants: {
    variant: "top",
  },
});

function Glow({
                className,
                variant,
                ...props
              }) {
  return (
      <div
          data-slot="glow"
          className={cn(glowVariants({ variant }), className)}
          {...props}>
        <div
            className={cn(
                "absolute left-1/2 h-[256px] w-[60%] -translate-x-1/2 scale-[2.5] rounded-[50%] sm:h-[512px]",
                variant === "center" && "-translate-y-1/2"
            )}
            style={{ background: 'radial-gradient(closest-side, rgba(56, 139, 194, 0.5), transparent)' }}
        />
        <div
            className={cn(
                "absolute left-1/2 h-[128px] w-[40%] -translate-x-1/2 scale-200 rounded-[50%] sm:h-[256px]",
                variant === "center" && "-translate-y-1/2"
            )}
            style={{ background: 'radial-gradient(closest-side, rgba(56, 139, 194, 0.3), transparent)' }}
        />
      </div>
  );
}

export default Glow;

"use client";

import { cn } from "@/lib/utils";

export function Section({ children, className, ...props }) {
  return (
    <section
      className={cn("py-12 sm:py-16 lg:py-20 px-4", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export default Section;

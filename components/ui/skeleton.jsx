import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-xl skeleton-shimmer", className)}
      {...props} />
  );
}

export { Skeleton }

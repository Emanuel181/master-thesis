import { cn } from "@/lib/utils"

function Skeleton({
  className,
  shimmer = false,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md",
        shimmer
          ? "bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]"
          : "bg-accent animate-pulse",
        className
      )}
      {...props} />
  );
}

export { Skeleton }

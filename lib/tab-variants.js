/**
 * Shared tab trigger class variants for consistent styling across all dashboard pages.
 *
 * These constants centralize the Tailwind classNames used on shadcn/ui TabsTrigger
 * components so the same visual pattern is never duplicated inline.
 */

/**
 * Underline-style tab trigger — thin bottom border that turns primary on active.
 * Use with a `TabsList` that has `bg-transparent rounded-none border-b p-0`.
 */
export const UNDERLINE_TAB =
    "bg-transparent data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent data-[state=active]:border-primary dark:data-[state=active]:border-white data-[state=active]:text-foreground text-muted-foreground hover:text-foreground data-[state=inactive]:hover:bg-accent/50 h-full rounded-none border-0 border-b-2 border-transparent data-[state=active]:shadow-none transition-colors";


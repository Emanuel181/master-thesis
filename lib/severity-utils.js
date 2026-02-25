/**
 * Shared severity color definitions for consistent styling across all dashboard pages.
 *
 * Uses the design-system semantic tokens (--severity-*) defined in globals.css
 * so that dark/light mode is handled automatically.
 */

export const SEVERITY_LEVELS = ["Critical", "High", "Medium", "Low"];

export const SEVERITY_COLORS = {
    Critical: {
        text: "text-severity-critical",
        bg: "bg-severity-critical",
        bgSubtle: "bg-severity-critical/10",
        border: "border-severity-critical",
        borderSubtle: "border-severity-critical/30",
        borderLeft: "border-l-severity-critical",
        bar: "bg-severity-critical",
    },
    High: {
        text: "text-severity-high",
        bg: "bg-severity-high",
        bgSubtle: "bg-severity-high/10",
        border: "border-severity-high",
        borderSubtle: "border-severity-high/30",
        borderLeft: "border-l-severity-high",
        bar: "bg-severity-high",
    },
    Medium: {
        text: "text-severity-medium",
        bg: "bg-severity-medium",
        bgSubtle: "bg-severity-medium/10",
        border: "border-severity-medium",
        borderSubtle: "border-severity-medium/30",
        borderLeft: "border-l-severity-medium",
        bar: "bg-severity-medium",
    },
    Low: {
        text: "text-severity-low",
        bg: "bg-severity-low",
        bgSubtle: "bg-severity-low/10",
        border: "border-severity-low",
        borderSubtle: "border-severity-low/30",
        borderLeft: "border-l-severity-low",
        bar: "bg-severity-low",
    },
};

/**
 * Get the shadcn Badge variant that best represents a severity level.
 */
export function getSeverityBadgeVariant(severity) {
    switch (severity) {
        case "Critical":
        case "High":
            return "destructive";
        case "Medium":
            return "warning";
        case "Low":
        default:
            return "secondary";
    }
}

/**
 * Get severity color config — returns the full object or an empty fallback.
 */
export function getSeverityColors(severity) {
    return SEVERITY_COLORS[severity] || SEVERITY_COLORS.Medium;
}


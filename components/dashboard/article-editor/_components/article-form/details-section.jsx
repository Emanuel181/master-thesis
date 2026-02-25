"use client"

import { FileText } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CollapsibleSection } from "./collapsible-section"

/**
 * DetailsSection - Article title, excerpt, and category fields
 */
export function DetailsSection({
    formState,
    updateField,
    canEdit,
    categories,
}) {
    const titleLength = formState.title?.length || 0
    const excerptLength = formState.excerpt?.length || 0
    const TITLE_MAX = 100
    const EXCERPT_MAX = 300

    return (
        <CollapsibleSection
            title="Article Details"
            description="Title, excerpt, and category"
            icon={FileText}
            defaultOpen={true}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Title</Label>
                        <span className={cn(
                            "text-[10px] tabular-nums",
                            titleLength > TITLE_MAX ? "text-destructive" : "text-muted-foreground"
                        )}>
                            {titleLength}/{TITLE_MAX}
                        </span>
                    </div>
                    <Input
                        placeholder="Enter article title..."
                        value={formState.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        disabled={!canEdit}
                        className={cn(
                            titleLength > TITLE_MAX && "border-destructive focus-visible:ring-destructive"
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label>Excerpt</Label>
                        <span className={cn(
                            "text-[10px] tabular-nums",
                            excerptLength > EXCERPT_MAX ? "text-destructive" : "text-muted-foreground"
                        )}>
                            {excerptLength}/{EXCERPT_MAX}
                        </span>
                    </div>
                    <Textarea
                        placeholder="Write a short description..."
                        value={formState.excerpt}
                        onChange={(e) => updateField("excerpt", e.target.value)}
                        rows={3}
                        disabled={!canEdit}
                        className={cn(
                            excerptLength > EXCERPT_MAX && "border-destructive focus-visible:ring-destructive"
                        )}
                    />
                    <p className="text-xs text-muted-foreground">
                        This will appear on article cards and search results
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                        value={formState.category}
                        onValueChange={(v) => updateField("category", v)}
                        disabled={!canEdit}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CollapsibleSection>
    )
}

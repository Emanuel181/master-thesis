"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/**
 * DetailsSection - Article title, excerpt, and category fields
 */
export function DetailsSection({
    formState,
    updateField,
    canEdit,
    categories,
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Article Details</CardTitle>
                <CardDescription className="text-xs">
                    Title, excerpt, and category
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                        placeholder="Enter article title..."
                        value={formState.title}
                        onChange={(e) => updateField("title", e.target.value)}
                        disabled={!canEdit}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Excerpt</Label>
                    <Textarea
                        placeholder="Write a short description..."
                        value={formState.excerpt}
                        onChange={(e) => updateField("excerpt", e.target.value)}
                        rows={3}
                        disabled={!canEdit}
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
            </CardContent>
        </Card>
    )
}

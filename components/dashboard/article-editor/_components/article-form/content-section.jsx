"use client"

import { Maximize2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * ContentSection - Content editor section with fullscreen button
 */
export function ContentSection({
    selectedArticle,
    canEdit,
    lastSavedAt,
    onOpenFullscreen,
}) {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm">Content</CardTitle>
                <CardDescription className="text-xs">
                    Write your article content
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        Your progress is automatically saved every 30 seconds while editing.
                        {lastSavedAt && (
                            <span className="block mt-1 text-muted-foreground">
                                Last saved: {lastSavedAt.toLocaleTimeString()}
                            </span>
                        )}
                    </AlertDescription>
                </Alert>
                <Button
                    onClick={onOpenFullscreen}
                    className="w-full"
                    size="lg"
                    disabled={!canEdit}
                >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Open Fullscreen Editor
                </Button>
                {selectedArticle?.readTime && (
                    <p className="text-xs text-muted-foreground text-center">
                        Estimated read time:{" "}
                        <span className="font-medium">{selectedArticle.readTime}</span>
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

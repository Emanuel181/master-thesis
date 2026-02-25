"use client"

import { Image as ImageIcon, Palette, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { IconDisplay } from "./icon-display"
import { CollapsibleSection } from "./collapsible-section"

/**
 * CoverSection - Cover image/gradient selection with preview
 */
export function CoverSection({
    formState,
    updateField,
    canEdit,
    presetGradients,
    iconPositions,
    iconColors,
    onCoverImageUpload,
}) {
    const iconPosition = iconPositions.find((p) => p.id === formState.iconPosition)
    const iconColor = iconColors.find((c) => c.id === formState.iconColor)
    // Support custom colors saved with "custom-#hex" IDs
    const resolvedIconColor = iconColor || (formState.iconColor?.startsWith("custom-")
        ? { value: formState.iconColor.replace("custom-", ""), bg: "bg-black/40" }
        : null
    )

    return (
        <CollapsibleSection
            title="Cover"
            description="Choose a gradient or upload an image"
            icon={Palette}
            defaultOpen={true}
        >
            <div className="space-y-4">
                {/* Cover Preview with Icon */}
                <motion.div
                    whileHover={{ scale: 1.005 }}
                    transition={{ duration: 0.2 }}
                    className="relative h-48 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50"
                    style={{
                        backgroundColor: formState.coverType === "gradient" ? undefined : "hsl(var(--muted))",
                        backgroundImage:
                            formState.coverType === "gradient"
                                ? formState.gradient
                                : formState.coverImage
                                    ? `url(${formState.coverImage})`
                                    : undefined,
                        backgroundSize: formState.coverType === "gradient" ? "200% 200%" : "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                    }}
                >
                    {formState.coverType === "image" && !formState.coverImage && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                    )}
                    {formState.iconName && (
                        <div
                            className={cn(
                                "absolute inset-0 flex p-4",
                                iconPosition?.class || "items-center justify-center"
                            )}
                        >
                            <div
                                className={cn(
                                    "backdrop-blur-sm rounded-full p-4 shadow-lg",
                                    resolvedIconColor?.bg || "bg-black/40"
                                )}
                            >
                                <IconDisplay
                                    name={formState.iconName}
                                    className="h-10 w-10"
                                    style={{ color: resolvedIconColor?.value || "#ffffff" }}
                                />
                            </div>
                        </div>
                    )}
                </motion.div>

                <Tabs
                    value={formState.coverType}
                    onValueChange={(v) => updateField("coverType", v)}
                >
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="gradient" className="text-xs">
                            <Palette className="h-3.5 w-3.5 mr-1.5" />
                            Gradient
                        </TabsTrigger>
                        <TabsTrigger value="image" className="text-xs">
                            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                            Image
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="gradient" className="space-y-4 mt-4">
                        <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2.5 sm:gap-3 p-1">
                            {presetGradients.map((g) => {
                                const isSelected = formState.gradient === g.value
                                return (
                                    <TooltipProvider key={g.name}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    className={cn(
                                                        "relative h-12 rounded-lg transition-all overflow-hidden",
                                                        isSelected
                                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                                            : "ring-1 ring-border/50 hover:ring-2 hover:ring-muted-foreground/50"
                                                    )}
                                                    style={{ background: g.value }}
                                                    onClick={() => updateField("gradient", g.value)}
                                                    disabled={!canEdit}
                                                >
                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                exit={{ scale: 0, opacity: 0 }}
                                                                className="absolute inset-0 flex items-center justify-center bg-black/25"
                                                            >
                                                                <Check className="h-4 w-4 text-white drop-shadow-md" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent>{g.name}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="image" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Image URL</Label>
                            <Input
                                placeholder="https://example.com/image.jpg"
                                value={formState.coverImage}
                                onChange={(e) => updateField("coverImage", e.target.value)}
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">or</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Upload from device</Label>
                            <label
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
                                    "hover:bg-muted/50 hover:border-primary/50",
                                    !canEdit && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex flex-col items-center justify-center py-4">
                                    <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">
                                        <span className="font-medium text-primary">Click to upload</span>{" "}
                                        or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                        PNG, JPG, GIF, WebP
                                    </p>
                                </div>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={!canEdit}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) onCoverImageUpload(file)
                                    }}
                                />
                            </label>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </CollapsibleSection>
    )
}

"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, GitBranch } from "lucide-react"

const IMPORT_STEPS = [
    { threshold: 15, label: 'Connecting to repository' },
    { threshold: 30, label: 'Fetching structure' },
    { threshold: 70, label: 'Processing files' },
    { threshold: 90, label: 'Setting up project' },
    { threshold: 100, label: 'Complete' },
]

/**
 * Import progress dialog component.
 * Shows progress when importing a repository.
 */
export function ImportProgressDialog({ importingRepo }) {
    const progress = importingRepo?.progress || 0

    return (
        <Dialog open={importingRepo !== null} onOpenChange={() => {}}>
            <DialogContent className="w-[90vw] max-w-md p-4 sm:p-6" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                        {progress === 100 ? (
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        ) : (
                            <GitBranch className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        )}
                        <span className="truncate">Importing Repository</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm truncate">
                        {importingRepo?.repo?.full_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
                    {/* Progress bar */}
                    <div className="space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-muted-foreground truncate">{importingRepo?.status}</span>
                            <span className="font-medium flex-shrink-0">{progress}%</span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-1.5 sm:h-2 transition-all duration-300"
                        />
                    </div>

                    {/* Steps indicator */}
                    <div className="space-y-1.5 sm:space-y-2">
                        {IMPORT_STEPS.map((step, i) => {
                            const isComplete = progress >= step.threshold
                            const isActive = progress > (i === 0 ? 0 : IMPORT_STEPS[i - 1].threshold) && progress < step.threshold

                            return (
                                <div
                                    key={step.label}
                                    className={`flex items-center gap-2 text-xs transition-all duration-200 ${
                                        isComplete 
                                            ? 'text-green-600' 
                                            : isActive 
                                                ? 'text-primary font-medium' 
                                                : 'text-muted-foreground/50'
                                    }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                                        isComplete 
                                            ? 'bg-green-500' 
                                            : isActive 
                                                ? 'bg-primary animate-pulse' 
                                                : 'bg-muted-foreground/30'
                                    }`} />
                                    {step.label}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

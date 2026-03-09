import { Skeleton } from "@/components/ui/skeleton"

export default function AdminLoading() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                </div>
                <div className="grid gap-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="rounded-lg border bg-card p-4 flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                            <Skeleton className="h-8 w-20 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}


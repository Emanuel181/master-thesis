import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Profile header skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                {/* Profile sections */}
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-4">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
            </div>
        </div>
    )
}


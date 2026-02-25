import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function DashboardLoading() {
    return (
        <div className="flex h-screen w-full bg-background">
            {/* Sidebar skeleton */}
            <div className="hidden md:flex w-64 flex-col border-r border-border/40 p-4 gap-4">
                <div className="flex items-center gap-3 px-2 py-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-5 w-24" />
                </div>
                <div className="flex flex-col gap-2 mt-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 px-3 py-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                    ))}
                </div>
                <div className="mt-auto flex flex-col gap-2">
                    <Skeleton className="h-px w-full" />
                    <div className="flex items-center gap-3 px-3 py-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex flex-col gap-1 flex-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-2 w-28" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex h-14 items-center gap-4 border-b border-border/40 px-4">
                    <Skeleton className="h-8 w-8 md:hidden" />
                    <Skeleton className="h-4 w-32 hidden sm:block" />
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                </div>
                <div className="flex-1 p-4 md:p-6 overflow-hidden">
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-4 w-72" />
                        </div>
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-12 w-12 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-5 w-40" />
                                        <Skeleton className="h-3 w-56" />
                                    </div>
                                </div>
                                <Skeleton className="h-px w-full" />
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-4 w-4/6" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}


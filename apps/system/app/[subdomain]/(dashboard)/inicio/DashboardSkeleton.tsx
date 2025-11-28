import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Card, CardContent, CardHeader } from "@repo/ui/components/shadcn/card";

export function DashboardSkeleton() {
    return (
        <div className="space-y-8 p-6 w-full">
            {/* Header Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
                <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="space-y-3 w-full">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-14 w-14 rounded-xl" />
                                <div className="space-y-2 w-full max-w-md">
                                    <Skeleton className="h-8 w-3/4" />
                                    <Skeleton className="h-5 w-1/2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-8 w-8 rounded-lg" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-8 w-16" />
                            <Skeleton className="h-3 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions / Content Skeleton */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-full" />
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

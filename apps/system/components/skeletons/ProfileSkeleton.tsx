import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Card, CardContent, CardHeader } from "@repo/ui/components/shadcn/card";

export function ProfileSkeleton() {
    return (
        <div className="space-y-8 p-6">
            {/* Header Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border">
                <div className="relative p-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-14 w-14 rounded-xl" />
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-64" />
                                <Skeleton className="h-5 w-96" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="p-6 grid md:grid-cols-3 gap-8">
                    {/* Logo Column */}
                    <div className="col-span-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="aspect-square max-w-[220px] rounded-2xl w-full" />
                    </div>

                    {/* Middle Column */}
                    <div className="col-span-1 space-y-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>

                    {/* Right Column */}
                    <div className="col-span-1 space-y-6">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

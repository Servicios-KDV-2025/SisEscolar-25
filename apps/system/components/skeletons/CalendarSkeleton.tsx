import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Card, CardContent, CardHeader } from "@repo/ui/components/shadcn/card";

export function CalendarSkeleton() {
    return (
        <div className="space-y-6">
            <div className="container mx-auto px-6 py-6">
                <div className="text-center space-y-4">
                    <div className="flex justify-center items-center gap-3 mb-5">
                        <Skeleton className="h-14 w-14 rounded-full" />
                        <Skeleton className="h-10 w-64" />
                    </div>
                    <Skeleton className="h-6 w-96 mx-auto" />
                </div>
            </div>

            {/* Filter Skeleton */}
            <div className="container mx-auto px-6 mb-6">
                <Card className="max-w-md mx-auto">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 justify-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-[200px]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Calendar Grid Skeleton */}
                    <div className="row-span-2 col-span-3 lg:col-span-2 xl:col-span-3">
                        <Card className="h-[600px]">
                            <CardHeader>
                                <div className="flex justify-between items-center mb-4">
                                    <Skeleton className="h-8 w-48" />
                                    <div className="flex gap-2">
                                        <Skeleton className="h-9 w-20" />
                                        <Skeleton className="h-9 w-20" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-7 gap-4 h-full">
                                    {Array.from({ length: 35 }).map((_, i) => (
                                        <Skeleton key={i} className="h-24 w-full" />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar Skeleton */}
                    <div className="col-span-1 xl:col-span-1">
                        <Card className="shadow-xl">
                            <CardContent className="px-4 pt-6">
                                <CardHeader className="flex flex-row justify-between pb-4 px-0">
                                    <div className="flex items-center gap-3 w-full">
                                        <Skeleton className="h-12 w-12 rounded-xl" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-4 w-1/2" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <div className="space-y-4 pt-4">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <Skeleton className="h-4 w-full" />
                                                <Skeleton className="h-3 w-2/3" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6">
                                    <Skeleton className="h-10 w-full rounded-lg" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

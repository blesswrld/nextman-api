import { Skeleton } from "@/components/ui/skeleton";

export function HistorySkeleton() {
    return (
        <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="p-2 border rounded-md">
                    <Skeleton className="h-4 w-3/4 mb-2 rounded" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-16 rounded" />
                        <Skeleton className="h-4 w-1/2 rounded" />
                    </div>
                </div>
            ))}
        </div>
    );
}

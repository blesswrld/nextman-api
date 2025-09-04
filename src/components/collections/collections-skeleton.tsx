import { Skeleton } from "@/components/ui/skeleton";

export function CollectionsSkeleton() {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-8 w-full rounded-md" />
                    <div className="pl-4 space-y-2">
                        <Skeleton className="h-6 w-3/4 rounded-md" />
                        <Skeleton className="h-6 w-1/2 rounded-md" />
                    </div>
                </div>
            ))}
        </div>
    );
}

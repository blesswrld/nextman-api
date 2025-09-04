import { Skeleton } from "@/components/ui/skeleton";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";

export function HomePageSkeleton() {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            {/* Скелет для Header */}
            <header className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                </div>
            </header>

            {/* Скелет для панели вкладок */}
            <div className="flex items-center border-b bg-muted/40 p-1 gap-1">
                <Skeleton className="h-8 w-40 rounded-md" />
                <Skeleton className="h-8 w-40 rounded-md" />
            </div>

            {/* Скелет для основной области */}
            <ResizablePanelGroup direction="horizontal" className="flex-grow">
                <ResizablePanel defaultSize={20} minSize={15}>
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-full" />
                    </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={80}>
                    <div className="p-4 h-full">
                        {/* Здесь можно добавить еще скелеты для панелей запроса/ответа */}
                        <Skeleton className="h-full w-full" />
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

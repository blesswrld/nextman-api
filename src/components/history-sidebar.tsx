"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { HistoryItem, getHistory, clearHistory } from "@/lib/history-db";
import { useTabsStore } from "@/store/tabs";
import { History } from "lucide-react";

export function HistorySidebar() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const addTab = useTabsStore((state) => state.addTab);

    useEffect(() => {
        if (isOpen) {
            getHistory().then(setHistory);
        }
    }, [isOpen]);

    const handleClearHistory = async () => {
        await clearHistory();
        setHistory([]);
    };

    const handleHistoryItemClick = (item: HistoryItem) => {
        addTab({
            name: `${item.method} ${item.url.slice(0, 20)}...`,
            method: item.method,
            url: item.url,
        });
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                    <History className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Request History</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                    <Button variant="destructive" onClick={handleClearHistory}>
                        Clear All
                    </Button>
                </div>
                <div className="flex flex-col gap-2 overflow-y-auto">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            className="p-2 border rounded-md hover:bg-muted cursor-pointer"
                            onClick={() => handleHistoryItemClick(item)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-green-500 w-16">
                                    {item.method}
                                </span>
                                <span className="text-sm truncate">
                                    {item.url}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                {new Date(item.timestamp).toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}

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
            name: item.name, // <-- ИСПОЛЬЗУЕМ СОХРАНЕННОЕ ИМЯ
            method: item.method,
            url: item.url,
            // Сбрасываем isDirty, так как вкладка только что "загружена" из истории
            isDirty: false,
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
                            {/* Отображаем сохраненное имя */}
                            <div className="text-sm font-medium truncate">
                                {item.name}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-semibold text-green-500 w-16 text-xs">
                                    {item.method}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {item.url}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
}

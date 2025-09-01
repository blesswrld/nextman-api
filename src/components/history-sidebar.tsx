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
import { History, Trash2, LogIn } from "lucide-react";
import { HistorySkeleton } from "./history-skeleton";
import { motion } from "framer-motion";
import { SheetDescription } from "@/components/ui/sheet";
import type { User } from "@supabase/supabase-js";

// 1. Объявляем, что наш компонент теперь принимает пропс `user`
interface HistorySidebarProps {
    user: User | null;
}

export function HistorySidebar({ user }: HistorySidebarProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const addTab = useTabsStore((state) => state.addTab);

    useEffect(() => {
        // Загружаем историю, когда сайдбар открывается И пользователь залогинен
        if (isOpen && user) {
            setLoading(true);
            getHistory().then((items) => {
                setHistory(items);
                setLoading(false);
            });
        }
    }, [isOpen, user]); // Добавляем user в массив зависимостей

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
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>Request History</SheetTitle>
                    <SheetDescription>
                        View and re-run your past 100 requests.
                    </SheetDescription>
                </SheetHeader>

                {/* 2. Добавляем условный рендеринг на основе пропса `user` */}
                {user ? (
                    <>
                        <div className="py-4">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleClearHistory}
                                disabled={history.length === 0}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Clear All
                            </Button>
                        </div>
                        <div className="flex-grow overflow-y-auto">
                            {loading ? (
                                <HistorySkeleton />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {history.length > 0 ? (
                                        <div className="flex flex-col gap-2">
                                            {history.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-2 border rounded-md hover:bg-muted cursor-pointer"
                                                    onClick={() =>
                                                        handleHistoryItemClick(
                                                            item
                                                        )
                                                    }
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
                                    ) : (
                                        // Улучшенное пустое состояние
                                        <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                                            <History className="h-10 w-10 mx-auto text-muted-foreground" />
                                            <h3 className="mt-2 text-sm font-semibold">
                                                No History Yet
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Your recent requests will appear
                                                here.
                                            </p>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>
                    </>
                ) : (
                    // 3. Заглушка для неавторизованного пользователя
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <LogIn className="h-10 w-10 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-semibold">
                            Login to see History
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Request history is only available for logged in
                            users.
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

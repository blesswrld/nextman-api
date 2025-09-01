"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeEditor } from "@/components/editor";
import { KeyValueEditor, KeyValuePair } from "@/components/key-value-editor";
import { useTabsStore } from "@/store/tabs";
import { cn } from "@/lib/utils";
import { X, Plus } from "lucide-react";
import { HistorySidebar } from "@/components/history-sidebar";
import { useEffect, useState } from "react";
import { ResponseHeaders } from "@/components/response-headers";
import { EditableTab } from "@/components/editable-tab";
import { AuthButton } from "@/components/auth-button";
import { CollectionsSidebar } from "@/components/collections-sidebar";
import { SaveRequestDialog } from "@/components/save-request-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "@/hooks/use-hotkeys"; // <-- Импорт
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
    // --- Получаем всё состояние и действия из нашего глобального хранилища Zustand ---
    const {
        tabs,
        activeTabId,
        addTab,
        closeTab,
        setActiveTab,
        updateActiveTab,
        sendRequest, // Главное действие для отправки запроса
        init, // Действие для инициализации
    } = useTabsStore();

    const [user, setUser] = useState<User | null>(null);

    // Добавляем горячую клавишу
    useHotkeys([["ctrl+enter", () => sendRequest()]]);
    useHotkeys([["cmd+enter", () => sendRequest()]]); // Для Mac

    // Инициализируем стор один раз при монтировании компонента
    useEffect(() => {
        if (init) init();

        const supabase = createClient();
        const getUserAndSetupListener = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);

            const { data: authListener } = supabase.auth.onAuthStateChange(
                (event, session) => {
                    setUser(session?.user ?? null);
                }
            );

            return () => {
                authListener.subscription.unsubscribe();
            };
        };
        const unsubscribePromise = getUserAndSetupListener();
        return () => {
            unsubscribePromise.then((unsubscribe) => unsubscribe());
        };
    }, [init]);

    // --- Находим активную вкладку по её ID ---
    const activeTab = tabs.find((tab) => tab.id === activeTabId);

    // --- Функции для обновления данных в сторе ---
    // Они вызываются дочерними компонентами и обновляют состояние активной вкладки
    const handleUrlChange = (url: string) => updateActiveTab({ url });
    const handleMethodChange = (method: string) => updateActiveTab({ method });
    const handleBodyChange = (body: string | undefined) =>
        updateActiveTab({ body: body || "" });
    const handleQueryParamsChange = (queryParams: KeyValuePair[]) =>
        updateActiveTab({ queryParams });
    const handleHeadersChange = (headers: KeyValuePair[]) =>
        updateActiveTab({ headers });

    // --- Если активной вкладки нет (например, все закрыты или при первой загрузке), показываем заглушку ---
    if (!activeTab) {
        return (
            <div className="flex flex-col h-screen bg-background text-foreground">
                <header className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                    <h1 className="text-xl font-bold">Nextman API</h1>
                    <div className="flex items-center gap-2">
                        <HistorySidebar user={user} />
                        <AuthButton />
                    </div>
                </header>
                <main className="flex items-center justify-center flex-grow">
                    {/* Кнопка "Создать запрос" появляется, если все вкладки были закрыты */}
                    <Button onClick={() => addTab()}>
                        Create a new request
                    </Button>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                <h1 className="text-xl font-bold">Nextman API</h1>
                <div className="flex items-center gap-2">
                    <HistorySidebar user={user} />
                    <AuthButton />
                </div>
            </header>

            {/* Панель с вкладками запросов */}
            <div className="flex items-center border-b bg-muted/40 p-1 gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        // Оборачиваем все в div и стилизуем его, чтобы он был похож на кнопку вкладки
                        className={cn(
                            "h-8 px-2 relative flex-shrink-0 flex items-center rounded-md group",
                            activeTabId === tab.id
                                ? "bg-background shadow-sm"
                                : "hover:bg-accent hover:text-accent-foreground"
                        )}
                    >
                        <div
                            onClick={() => setActiveTab(tab.id)}
                            className="flex items-center cursor-pointer flex-grow h-full pr-2"
                        >
                            {/* Индикатор изменений */}
                            <AnimatePresence>
                                {tab.isDirty && (
                                    <motion.span
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="mr-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"
                                    />
                                )}
                            </AnimatePresence>

                            <span
                                className={cn(
                                    "text-xs font-semibold",
                                    tab.method === "GET" && "text-green-500",
                                    tab.method === "POST" && "text-yellow-500",
                                    tab.method === "PUT" && "text-blue-500",
                                    tab.method === "DELETE" && "text-red-500"
                                )}
                            >
                                {tab.method}
                            </span>

                            <EditableTab
                                initialName={tab.name}
                                onNameChange={(newName) =>
                                    updateActiveTab({ name: newName })
                                }
                            />
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation(); // Предотвращаем любые другие клики
                                closeTab(tab.id);
                            }}
                            className={cn(
                                "h-5 w-5 rounded-full",
                                activeTabId === tab.id
                                    ? "opacity-100"
                                    : "opacity-0 group-hover:opacity-100"
                            )}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => addTab()}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Главная структура с сайдбаром коллекций и основной рабочей областью */}
            <ResizablePanelGroup direction="horizontal" className="flex-grow">
                {/* Левая панель: Коллекции */}
                <ResizablePanel defaultSize={20} minSize={15}>
                    <CollectionsSidebar />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Правая панель: Основной контент (запрос/ответ) */}
                <ResizablePanel defaultSize={80}>
                    <main className="h-full p-4">
                        <ResizablePanelGroup
                            direction="vertical"
                            className="h-full"
                        >
                            {/* Верхняя панель: Запрос */}
                            <ResizablePanel defaultSize={40} minSize={20}>
                                <div className="p-4 h-full flex flex-col gap-4">
                                    {/* Строка URL */}
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={activeTab.method}
                                            onValueChange={handleMethodChange}
                                        >
                                            <SelectTrigger className="w-[120px]">
                                                <SelectValue placeholder="Method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="GET">
                                                    GET
                                                </SelectItem>
                                                <SelectItem value="POST">
                                                    POST
                                                </SelectItem>
                                                <SelectItem value="PUT">
                                                    PUT
                                                </SelectItem>
                                                <SelectItem value="PATCH">
                                                    PATCH
                                                </SelectItem>
                                                <SelectItem value="DELETE">
                                                    DELETE
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            type="text"
                                            value={activeTab.url}
                                            onChange={(e) =>
                                                handleUrlChange(e.target.value)
                                            }
                                            placeholder="https://api.example.com"
                                            className="flex-grow"
                                        />
                                        {/* Добавляем кнопку Save рядом с Send */}
                                        <SaveRequestDialog />
                                        <Button
                                            onClick={sendRequest}
                                            disabled={activeTab.loading}
                                        >
                                            {activeTab.loading
                                                ? "Sending..."
                                                : "Send"}
                                        </Button>
                                    </div>
                                    {/* Табы для параметров, заголовков, тела запроса */}
                                    <Tabs
                                        defaultValue="params"
                                        className="flex-grow flex flex-col"
                                    >
                                        <TabsList>
                                            <TabsTrigger value="params">
                                                Query Params
                                            </TabsTrigger>
                                            <TabsTrigger value="headers">
                                                Headers
                                            </TabsTrigger>
                                            <TabsTrigger value="body">
                                                Body
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent
                                            value="params"
                                            className="mt-4"
                                        >
                                            <KeyValueEditor
                                                pairs={activeTab.queryParams}
                                                setPairs={
                                                    handleQueryParamsChange
                                                }
                                                placeholderKey="Parameter"
                                            />
                                        </TabsContent>
                                        <TabsContent
                                            value="headers"
                                            className="mt-4"
                                        >
                                            <KeyValueEditor
                                                pairs={activeTab.headers}
                                                setPairs={handleHeadersChange}
                                                placeholderKey="Header"
                                            />
                                        </TabsContent>
                                        <TabsContent
                                            value="body"
                                            className="mt-4 flex-grow"
                                        >
                                            <CodeEditor
                                                value={activeTab.body}
                                                onChange={handleBodyChange}
                                            />
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle />

                            {/* Нижняя панель: Ответ */}
                            <ResizablePanel defaultSize={60} minSize={20}>
                                <div className="p-4 h-full flex flex-col">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-lg font-semibold">
                                            Response
                                        </h2>
                                        {/* Этот блок не анимируем, т.к. он должен обновляться мгновенно */}
                                        {activeTab.response && (
                                            <div className="flex items-center gap-4 text-sm">
                                                <span>
                                                    Status:{" "}
                                                    <span
                                                        className={cn(
                                                            "font-semibold",
                                                            activeTab.response
                                                                .status >=
                                                                200 &&
                                                                activeTab
                                                                    .response
                                                                    .status <
                                                                    300
                                                                ? "text-green-500"
                                                                : "text-red-500"
                                                        )}
                                                    >
                                                        {
                                                            activeTab.response
                                                                .status
                                                        }{" "}
                                                        {
                                                            activeTab.response
                                                                .statusText
                                                        }
                                                    </span>
                                                </span>
                                                <span>
                                                    Time:{" "}
                                                    <span className="font-semibold text-blue-500">
                                                        {
                                                            activeTab.response
                                                                .time
                                                        }{" "}
                                                        ms
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Анимируем переключение между состоянием с ответом и заглушкой */}
                                    <AnimatePresence mode="wait">
                                        {activeTab.response ? (
                                            <motion.div
                                                key="response-data"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-grow flex flex-col min-h-0" // min-h-0 важен для правильной работы flex
                                            >
                                                <Tabs
                                                    defaultValue="body"
                                                    className="flex-grow flex flex-col"
                                                >
                                                    <TabsList>
                                                        <TabsTrigger value="body">
                                                            Body
                                                        </TabsTrigger>
                                                        <TabsTrigger value="headers">
                                                            Headers
                                                        </TabsTrigger>
                                                    </TabsList>
                                                    <TabsContent
                                                        value="body"
                                                        className="mt-4 flex-grow"
                                                    >
                                                        <CodeEditor
                                                            value={
                                                                activeTab
                                                                    .response
                                                                    .body
                                                            }
                                                            readOnly={true}
                                                            key={
                                                                activeTab.id +
                                                                activeTab
                                                                    .response
                                                                    .body
                                                            }
                                                        />
                                                    </TabsContent>
                                                    <TabsContent
                                                        value="headers"
                                                        className="mt-4 overflow-y-auto"
                                                    >
                                                        <ResponseHeaders
                                                            headers={
                                                                activeTab
                                                                    .response
                                                                    .headers
                                                            }
                                                        />
                                                    </TabsContent>
                                                </Tabs>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="response-placeholder"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-grow flex items-center justify-center border rounded-md bg-muted/20"
                                            >
                                                <p className="text-muted-foreground">
                                                    {activeTab.loading
                                                        ? "Waiting for response..."
                                                        : "Send a request to see the response here"}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </main>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

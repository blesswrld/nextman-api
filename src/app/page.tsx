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
import { useEffect } from "react";
import { ResponseHeaders } from "@/components/response-headers";
import { EditableTab } from "@/components/editable-tab";

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

    // Инициализируем стор один раз при монтировании компонента
    useEffect(() => {
        if (init) init();
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
                    <HistorySidebar />
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
                <HistorySidebar />
            </header>

            {/* Панель с вкладками запросов */}
            <div className="flex items-center border-b bg-muted/40 p-1 gap-1 overflow-x-auto">
                {tabs.map((tab) => (
                    <Button
                        key={tab.id}
                        variant="ghost"
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "h-8 px-2 relative flex-shrink-0", // flex-shrink-0 важен для скролла
                            activeTabId === tab.id && "bg-background shadow-sm"
                        )}
                    >
                        {/* Индикатор изменений */}
                        {tab.isDirty && (
                            <span className="ml-2 h-2 w-2 rounded-full bg-blue-500"></span>
                        )}

                        <EditableTab
                            initialName={tab.name}
                            onNameChange={(newName) =>
                                updateActiveTab({ name: newName })
                            }
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Предотвращаем клик по основной кнопке
                                closeTab(tab.id);
                            }}
                            className="ml-2 p-0.5 rounded hover:bg-destructive/20"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Button>
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

            <main className="flex-grow p-4">
                <ResizablePanelGroup
                    direction="vertical"
                    className="h-full border rounded-lg"
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
                                        <SelectItem value="GET">GET</SelectItem>
                                        <SelectItem value="POST">
                                            POST
                                        </SelectItem>
                                        <SelectItem value="PUT">PUT</SelectItem>
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
                                <Button
                                    onClick={sendRequest} // <-- Используем действие из стора
                                    disabled={activeTab.loading}
                                >
                                    {activeTab.loading ? "Sending..." : "Send"}
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
                                    <TabsTrigger value="body">Body</TabsTrigger>
                                </TabsList>
                                <TabsContent value="params" className="mt-4">
                                    <KeyValueEditor
                                        pairs={activeTab.queryParams}
                                        setPairs={handleQueryParamsChange}
                                        placeholderKey="Parameter"
                                    />
                                </TabsContent>
                                <TabsContent value="headers" className="mt-4">
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
                                {activeTab.response && (
                                    <div className="flex items-center gap-4 text-sm">
                                        <span>
                                            Status:{" "}
                                            <span
                                                className={cn(
                                                    "font-semibold",
                                                    activeTab.response.status >=
                                                        200 &&
                                                        activeTab.response
                                                            .status < 300
                                                        ? "text-green-500"
                                                        : "text-red-500"
                                                )}
                                            >
                                                {activeTab.response.status}{" "}
                                                {activeTab.response.statusText}
                                            </span>
                                        </span>
                                        <span>
                                            Time:{" "}
                                            <span className="font-semibold text-blue-500">
                                                {activeTab.response.time} ms
                                            </span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {activeTab.response ? (
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
                                            value={activeTab.response.body}
                                            readOnly={true}
                                            key={
                                                activeTab.id +
                                                activeTab.response.body
                                            }
                                        />
                                    </TabsContent>
                                    <TabsContent
                                        value="headers"
                                        className="mt-4 overflow-y-auto"
                                    >
                                        <ResponseHeaders
                                            headers={activeTab.response.headers}
                                        />
                                    </TabsContent>
                                </Tabs>
                            ) : (
                                <div className="flex-grow flex items-center justify-center border rounded-md bg-muted/20">
                                    <p className="text-muted-foreground">
                                        {activeTab.loading
                                            ? "Waiting for response..."
                                            : "Send a request to see the response here"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}

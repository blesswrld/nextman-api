"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HomePage() {
    const [url, setUrl] = useState(
        "https://jsonplaceholder.typicode.com/todos/1"
    );
    const [method, setMethod] = useState("GET");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSendRequest = async () => {
        setLoading(true);
        setResponse("");
        try {
            const res = await fetch("/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url, method }),
            });
            if (!res.ok)
                throw new Error(`Proxy request failed: ${res.statusText}`);
            const data = await res.json();
            setResponse(JSON.stringify(data, null, 2));
        } catch (error) {
            const errorResponse =
                error instanceof Error
                    ? { error: error.message }
                    : { error: "An unknown error occurred" };
            setResponse(JSON.stringify(errorResponse, null, 2));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="p-4 border-b flex-shrink-0">
                <h1 className="text-xl font-bold">My API Client</h1>
            </header>

            <main className="flex-grow p-4">
                <ResizablePanelGroup
                    direction="vertical"
                    className="h-full border rounded-lg"
                >
                    {/* Верхняя панель: Запрос */}
                    <ResizablePanel defaultSize={40}>
                        <div className="p-4 h-full flex flex-col gap-4">
                            {/* Строка URL */}
                            <div className="flex items-center gap-2">
                                <Select
                                    value={method}
                                    onValueChange={setMethod}
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
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://api.example.com"
                                    className="flex-grow"
                                />
                                <Button
                                    onClick={handleSendRequest}
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Send"}
                                </Button>
                            </div>
                            {/* Табы для параметров, заголовков, тела запроса */}
                            <Tabs defaultValue="body" className="flex-grow">
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
                                    Тут будут Query Params
                                </TabsContent>
                                <TabsContent value="headers" className="mt-4">
                                    Тут будут Headers
                                </TabsContent>
                                <TabsContent value="body" className="mt-4">
                                    Тут будет редактор для тела запроса
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Нижняя панель: Ответ */}
                    <ResizablePanel defaultSize={60}>
                        <div className="p-4 h-full flex flex-col">
                            <h2 className="text-lg font-semibold mb-2">
                                Response
                            </h2>
                            <Textarea
                                readOnly
                                value={response}
                                placeholder="Response data will appear here..."
                                className="w-full flex-grow font-mono text-sm resize-none"
                            />
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}

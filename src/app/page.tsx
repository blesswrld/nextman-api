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
import { CodeEditor } from "@/components/editor";
import { KeyValueEditor, KeyValuePair } from "@/components/key-value-editor";

export default function HomePage() {
    const [url, setUrl] = useState(
        "https://jsonplaceholder.typicode.com/todos/1"
    );
    const [method, setMethod] = useState("GET");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [body, setBody] = useState('{\n  "key": "value"\n}');
    const [queryParams, setQueryParams] = useState<KeyValuePair[]>([
        { id: crypto.randomUUID(), key: "", value: "" },
    ]);
    const [headers, setHeaders] = useState<KeyValuePair[]>([
        { id: crypto.randomUUID(), key: "", value: "" },
    ]);

    const handleSendRequest = async () => {
        setLoading(true);
        setResponse("");
        try {
            // Проверяем, что тело запроса - валидный JSON, если метод это подразумевает
            // @ts-ignore
            let parsedBody: any = null;
            if (
                ["POST", "PUT", "PATCH"].includes(method) &&
                body.trim() !== ""
            ) {
                try {
                    parsedBody = JSON.parse(body);
                } catch (e) {
                    throw new Error("Invalid JSON in request body");
                }
            }

            const finalUrl = buildUrlWithParams();
            const finalHeaders = buildHeadersObject();

            const res = await fetch("/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: finalUrl,
                    method,
                    headers: finalHeaders,
                    body: parsedBody ? JSON.stringify(parsedBody) : undefined,
                }),
            });

            if (!res.ok)
                throw new Error(
                    `Proxy request failed: ${res.status} ${res.statusText}`
                );

            const data = await res.json();

            // Пытаемся красиво отформатировать тело ответа
            let formattedBody = data.body;
            try {
                const parsedJson = JSON.parse(data.body);
                formattedBody = JSON.stringify(parsedJson, null, 2);
            } catch (e) {
                // Если не JSON, оставляем как есть
            }
            data.body = formattedBody;

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

    // Функция для сборки URL с параметрами:
    const buildUrlWithParams = () => {
        const activeParams = queryParams.filter((p) => p.key);
        if (activeParams.length === 0) {
            return url;
        }
        const params = new URLSearchParams();
        activeParams.forEach((p) => params.append(p.key, p.value));

        // Проверяем, есть ли в URL уже параметры
        const [baseUrl, existingParams] = url.split("?");
        if (existingParams) {
            return `${url}&${params.toString()}`;
        }
        return `${baseUrl}?${params.toString()}`;
    };

    // Функция для преобразования заголовков в объект:
    const buildHeadersObject = () => {
        const activeHeaders = headers.filter((h) => h.key);
        const headersObj: Record<string, string> = {};
        activeHeaders.forEach((h) => {
            headersObj[h.key] = h.value;
        });
        return headersObj;
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="p-4 border-b flex-shrink-0">
                <h1 className="text-xl font-bold">Nextman API</h1>
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
                            <Tabs
                                defaultValue="body"
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
                                        pairs={queryParams}
                                        setPairs={setQueryParams}
                                        placeholderKey="Parameter"
                                    />
                                </TabsContent>
                                <TabsContent value="headers" className="mt-4">
                                    <KeyValueEditor
                                        pairs={headers}
                                        setPairs={setHeaders}
                                        placeholderKey="Header"
                                    />
                                </TabsContent>
                                <TabsContent
                                    value="body"
                                    className="mt-4 flex-grow"
                                >
                                    <CodeEditor
                                        value={body}
                                        onChange={(value) =>
                                            setBody(value || "")
                                        }
                                    />
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
                            <div className="flex-grow">
                                {/* Устанавливаем `key`, чтобы редактор перерендерился при новом ответе */}
                                <CodeEditor
                                    value={response}
                                    readOnly={true}
                                    key={response}
                                />
                            </div>
                        </div>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </main>
        </div>
    );
}

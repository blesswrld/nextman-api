"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTabsStore } from "@/store/tabs";
import { useEnvironmentsStore } from "@/store/environments";
import { useTranslation } from "react-i18next";
import {
    generateCurl,
    generateFetch,
    generateAxios,
} from "@/lib/code-generators";

export function CodeGenerationDialog() {
    const { t } = useTranslation();

    const activeTab = useTabsStore((state) =>
        state.tabs.find((t) => t.id === state.activeTabId)
    );
    const activeEnvironment = useEnvironmentsStore(
        (state) => state.activeEnvironment
    );

    const [generatedCode, setGeneratedCode] = useState({
        curl: "",
        fetch: "",
        axios: "",
    }); // Добавляем axios
    const [copied, setCopied] = useState<"curl" | "fetch" | "axios" | null>(
        null
    );

    // Helper-функция для подстановки переменных
    const applyVariables = (text: string): string => {
        if (!activeEnvironment || !activeEnvironment.variables) return text;
        let newText = text;
        const variables = activeEnvironment.variables as Record<string, string>;
        for (const key in variables) {
            newText = newText.replace(
                new RegExp(`\\{\\{${key}\\}\\}`, "g"),
                variables[key]
            );
        }
        return newText;
    };

    const handleGenerateCode = () => {
        if (!activeTab) return;

        // Применяем переменные ко всем частям запроса
        const processedUrl = applyVariables(activeTab.url);
        const processedBody = applyVariables(activeTab.body);
        const processedHeaders = activeTab.headers
            .map((h) => ({ ...h, value: applyVariables(h.value) }))
            .filter((h) => h.key);

        // Собираем URL с query-параметрами
        const activeParams = activeTab.queryParams.filter((p) => p.key);
        let finalUrl = processedUrl;
        if (activeParams.length > 0) {
            const params = new URLSearchParams();
            activeParams.forEach((p) =>
                params.append(p.key, applyVariables(p.value))
            );
            finalUrl = `${processedUrl.split("?")[0]}?${params.toString()}`;
        }

        const input = {
            url: finalUrl,
            method: activeTab.method,
            headers: processedHeaders,
            body: processedBody,
        };

        setGeneratedCode({
            curl: generateCurl(input),
            fetch: generateFetch(input),
            axios: generateAxios(input), // Генерируем axios
        });
    };

    const handleCopy = (text: string, type: "curl" | "fetch" | "axios") => {
        navigator.clipboard.writeText(text);
        setCopied(type); // Устанавливаем, что скопировали
        // Через 1.5 секунды сбрасываем состояние
        setTimeout(() => {
            setCopied(null);
        }, 1500);
    };

    return (
        <Dialog onOpenChange={(open) => open && handleGenerateCode()}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Code className="h-4 w-4 mr-2" />
                    {t("code_generator.button_text")}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {t("code_generator.dialog_title")}
                    </DialogTitle>
                    <DialogDescription>
                        {t("code_generator.dialog_description")}
                    </DialogDescription>
                </DialogHeader>
                <Tabs defaultValue="curl" className="w-full mt-4">
                    <TabsList>
                        <TabsTrigger value="curl">
                            {t("code_generator.curl_tab")}
                        </TabsTrigger>
                        <TabsTrigger value="fetch">
                            {t("code_generator.fetch_tab")}
                        </TabsTrigger>
                        <TabsTrigger value="axios">
                            {t("code_generator.axios_tab")}
                        </TabsTrigger>
                    </TabsList>

                    {/* Контент для таба cURL */}
                    <TabsContent value="curl" className="mt-2 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() =>
                                handleCopy(generatedCode.curl, "curl")
                            }
                        >
                            {/* Условный рендеринг иконки */}
                            {copied === "curl" ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                        <SyntaxHighlighter
                            language="bash"
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                borderRadius: "var(--radius)",
                                padding: "1rem",
                            }}
                            wrapLongLines={true}
                        >
                            {generatedCode.curl}
                        </SyntaxHighlighter>
                    </TabsContent>

                    {/* Контент для таба Fetch */}
                    <TabsContent value="fetch" className="mt-2 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() =>
                                handleCopy(generatedCode.fetch, "fetch")
                            }
                        >
                            {copied === "fetch" ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                        <SyntaxHighlighter
                            language="javascript"
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                borderRadius: "var(--radius)",
                                padding: "1rem",
                            }}
                            wrapLongLines={true}
                        >
                            {generatedCode.fetch}
                        </SyntaxHighlighter>
                    </TabsContent>

                    {/* Контент для таба Axios */}
                    <TabsContent value="axios" className="mt-2 relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() =>
                                handleCopy(generatedCode.axios, "axios")
                            }
                        >
                            {copied === "axios" ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Copy className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                        <SyntaxHighlighter
                            language="javascript"
                            style={vscDarkPlus}
                            customStyle={{
                                margin: 0,
                                borderRadius: "var(--radius)",
                                padding: "1rem",
                            }}
                            wrapLongLines={true}
                        >
                            {generatedCode.axios}
                        </SyntaxHighlighter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

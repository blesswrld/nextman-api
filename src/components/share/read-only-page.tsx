"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponseData, RequestTab } from "@/store/tabs";
import { cn } from "@/lib/utils";
import { ResponseHeaders } from "@/components/response/response-headers";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, ServerCrash, Copy, Check } from "lucide-react";
import { Button } from "../ui/button";
import { ThemeProvider } from "../core/theme-provider";
import { ThemeToggle } from "../core/theme-toggle";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { LanguageSwitcher } from "../i18n/language-switcher";
import { useTranslation } from "react-i18next";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import Image from "next/image";
import { useTheme } from "next-themes";

// --- КОМПОНЕНТ СКЕЛЕТА ЗАГРУЗКИ ---
export function ReadOnlyPageSkeleton() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="container mx-auto py-3 flex justify-between items-center">
                    <Skeleton className="h-7 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-9 w-36" />
                    </div>
                </div>
            </header>
            <main className="container mx-auto py-8 space-y-8">
                {/* Скелет для Hero-секции */}
                <div className="p-6 border rounded-lg bg-card">
                    <Skeleton className="h-9 w-3/4 mb-4" />
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-7 w-24" />
                    </div>
                </div>
                {/* Скелет для двух колонок */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-48 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

// Добавляем `shareName` в пропсы
interface ReadOnlyPageProps {
    requestTab: any; // Используй свой настоящий тип вместо any
    shareName: string | null;
}

// --- КОМПОНЕНТЫ, АДАПТИРОВАННЫЕ ДЛЯ READ-ONLY ---
const CodeEditor = dynamic(
    () => import("@/components/core/editor").then((mod) => mod.CodeEditor),
    { ssr: false, loading: () => <Skeleton className="w-full h-full" /> }
);

function ResponsePreview({ response }: { response: ResponseData }) {
    const { t } = useTranslation();

    const base64ToBlobUrl = (
        base64: string,
        contentType: string
    ): string | null => {
        try {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++)
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });
            return URL.createObjectURL(blob);
        } catch (e) {
            return null;
        }
    };

    const PreviewContainer = ({
        children,
        url,
    }: {
        children: React.ReactNode;
        url: string | null;
    }) => {
        if (!url) return null;
        return (
            <div className="relative w-full h-full">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 z-10 h-7 w-7 bg-background/50 hover:bg-background/80"
                    onClick={() => window.open(url, "_blank")}
                    title={t("previews.open_in_new_tab")}
                >
                    <ExternalLink className="h-4 w-4" />
                </Button>
                {children}
            </div>
        );
    };

    if (!response.contentType)
        return (
            <div className="p-4 text-muted-foreground">
                {t("previews.no_preview_available")}
            </div>
        );
    if (response.contentType.includes("text/html") && !response.isBase64) {
        const url = URL.createObjectURL(
            new Blob([response.rawBody], { type: "text/html" })
        );
        return (
            <PreviewContainer url={url}>
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    sandbox=""
                />
            </PreviewContainer>
        );
    }
    if (response.contentType.includes("image/svg+xml") && !response.isBase64) {
        const url = URL.createObjectURL(
            new Blob([response.rawBody], { type: "image/svg+xml" })
        );
        return (
            <PreviewContainer url={url}>
                <div className="w-full h-full flex items-center justify-center p-4 bg-white">
                    <img
                        src={url}
                        alt="SVG Preview"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            </PreviewContainer>
        );
    }
    if (response.isBase64) {
        const url = base64ToBlobUrl(response.rawBody, response.contentType);
        if (!url)
            return (
                <div className="p-4 text-destructive">
                    {t("previews.failed_to_load_base64")}
                </div>
            );
        if (response.contentType.startsWith("image/")) {
            return (
                <PreviewContainer url={url}>
                    <div className="w-full h-full flex items-center justify-center p-4 bg-muted">
                        <img
                            src={url}
                            alt="Response preview"
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                </PreviewContainer>
            );
        }
        if (response.contentType.includes("application/pdf")) {
            return (
                <PreviewContainer url={url}>
                    <iframe src={url} className="w-full h-full border-0" />
                </PreviewContainer>
            );
        }
    }
    if (
        response.contentType.includes("text/") ||
        response.contentType.includes("application/xml")
    ) {
        return (
            <pre className="p-4 text-sm whitespace-pre-wrap overflow-auto h-full">
                {response.rawBody}
            </pre>
        );
    }
    return (
        <div className="p-4 text-muted-foreground">
            {t("previews.unsupported_preview", {
                contentType: response.contentType,
            })}
        </div>
    );
}

function ReadOnlyKeyValue({ pairs, title }: { pairs: any[]; title: string }) {
    const { t } = useTranslation();

    const validPairs = pairs?.filter((p) => p && p.key);
    if (!validPairs || validPairs.length === 0) {
        // Динамический ключ для перевода заглушки
        const translationKey = `share_page.no_${title
            .toLowerCase()
            .replace(" ", "_")}` as const;
        return (
            <p className="text-sm text-muted-foreground p-4">
                {t(translationKey, { defaultValue: `No ${title} provided.` })}
            </p>
        );
    }
    return (
        <div className="space-y-2 font-mono text-sm p-4">
            {validPairs.map((pair) => (
                <div key={pair.id || pair.key} className="flex">
                    <span className="font-semibold w-1/3 break-all">
                        {pair.key}:
                    </span>
                    <span className="w-2/3 break-all text-muted-foreground">
                        {pair.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// --- ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ
function SharedRequestViewer({
    requestTab,
    pageTitle,
}: {
    requestTab: RequestTab;
    pageTitle: string;
}) {
    // --- Хуки и состояние ---
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    // --- ПОЛУЧАЕМ ТЕКУЩУЮ ТЕМУ ---
    const { resolvedTheme } = useTheme();

    // --- ДИНАМИЧЕСКИ ВЫБИРАЕМ ПУТЬ К ЛОГОТИПУ ---
    const logoSrc =
        resolvedTheme === "dark"
            ? "/nextman-logo-light.png"
            : "/nextman-logo-dark.png";

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const response = requestTab.response;

    // --- Эффект для безопасного монтирования на клиенте ---
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    // --- Обработчик копирования ---
    const handleCopy = (itemKey: string, text: string | null) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedItem(itemKey);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    // --- Мемоизированные переменные для производительности ---
    const showPreviewTab = React.useMemo(
        () =>
            response?.contentType &&
            (response.contentType.includes("text/html") ||
                response.contentType.startsWith("image/") ||
                response.contentType.includes("application/pdf") ||
                response.contentType.includes("application/xml") ||
                response.contentType.includes("image/svg+xml")),
        [response]
    );

    const responseStatus = response?.status;
    const responseStatusText = response?.statusText;

    const cleanedRequestBody = React.useMemo(() => {
        if (
            !requestTab.body ||
            JSON.stringify(requestTab.body) === "{}" ||
            JSON.stringify(requestTab.body) === "null"
        )
            return null;
        if (typeof requestTab.body === "string") return requestTab.body;
        return JSON.stringify(requestTab.body, null, 2);
    }, [requestTab.body]);

    const cleanedResponseBody = React.useMemo(() => {
        if (!response?.body) return "";
        if (typeof response.body === "string") {
            try {
                return JSON.stringify(JSON.parse(response.body), null, 2);
            } catch (e) {
                return response.body;
            }
        }
        return JSON.stringify(response.body, null, 2);
    }, [response]);

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
                <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                    <div className="container mx-auto py-3 flex justify-between items-center">
                        {isMounted ? (
                            <div className="flex items-center gap-2">
                                {/*  ЛОГОТИП ЗДЕСЬ */}
                                {/*  ИСПОЛЬЗУЕМ ДИНАМИЧЕСКИЙ ПУТЬ */}
                                <Image
                                    src={logoSrc}
                                    alt="Nextman Logo"
                                    className="rounded-sm"
                                    width={46}
                                    height={46}
                                    key={logoSrc}
                                />
                                <h1 className="text-xl font-bold">
                                    {t("header.title")}
                                </h1>
                            </div>
                        ) : (
                            <Skeleton className="h-7 w-32" />
                        )}
                        <div className="flex items-center gap-2">
                            {isMounted ? (
                                <>
                                    <LanguageSwitcher />
                                    <ThemeToggle />
                                    <Button asChild variant="secondary">
                                        <a
                                            href="/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {t("share_page.create_your_own")}
                                        </a>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Skeleton className="h-9 w-9" />
                                    <Skeleton className="h-9 w-9" />
                                    <Skeleton className="h-9 w-36" />
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {!isMounted ? (
                    <main className="container mx-auto py-8 space-y-8">
                        <div className="p-6 border rounded-lg bg-card">
                            <Skeleton className="h-9 w-3/4 mb-4" />
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-8 w-1/2" />
                                <Skeleton className="h-7 w-24" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg-grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-48 w-full" />
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <Skeleton className="h-6 w-24" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-48 w-full" />
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                ) : (
                    <>
                        <main className="container mx-auto py-8 space-y-8 flex-grow">
                            <div className="p-6 border rounded-lg bg-card text-card-foreground shadow-sm">
                                <h2 className="text-3xl font-bold break-all mb-4">
                                    {pageTitle}
                                </h2>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <div className="flex items-center gap-3 font-mono text-sm flex-grow min-w-0">
                                        <span
                                            className={cn(
                                                "font-bold px-3 py-1 rounded-md text-xs",
                                                requestTab.method === "GET" &&
                                                    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                                                requestTab.method === "POST" &&
                                                    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                                                requestTab.method === "PUT" &&
                                                    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                                                requestTab.method ===
                                                    "DELETE" &&
                                                    "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                            )}
                                        >
                                            {requestTab.method}
                                        </span>
                                        <span className="truncate text-muted-foreground">
                                            {requestTab.url}
                                        </span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 flex-shrink-0"
                                                    onClick={() =>
                                                        handleCopy(
                                                            "url",
                                                            requestTab.url
                                                        )
                                                    }
                                                >
                                                    {copiedItem === "url" ? (
                                                        <Check className="h-4 w-4 text-green-500" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>
                                                    {t("share_page.copy_url")}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    {responseStatus && (
                                        <div className="flex-shrink-0">
                                            <span
                                                className={cn(
                                                    "font-semibold px-3 py-1 rounded-md text-xs",
                                                    responseStatus >= 200 &&
                                                        responseStatus < 300
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                )}
                                            >
                                                {responseStatus}{" "}
                                                {responseStatusText}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            {t("share_page.request_title")}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="params">
                                            <TabsList>
                                                <TabsTrigger value="params">
                                                    {t(
                                                        "share_page.query_params_tab"
                                                    )}
                                                </TabsTrigger>
                                                <TabsTrigger value="headers">
                                                    {t(
                                                        "share_page.headers_tab"
                                                    )}
                                                </TabsTrigger>
                                                <TabsTrigger value="body">
                                                    {t("share_page.body_tab")}
                                                </TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="params">
                                                <ReadOnlyKeyValue
                                                    pairs={
                                                        requestTab.queryParams
                                                    }
                                                    title="Query Params"
                                                />
                                            </TabsContent>
                                            <TabsContent value="headers">
                                                <ReadOnlyKeyValue
                                                    pairs={requestTab.headers}
                                                    title="Headers"
                                                />
                                            </TabsContent>
                                            <TabsContent value="body">
                                                {cleanedRequestBody ? (
                                                    <div className="relative h-96">
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="absolute top-2 right-2 z-10 h-7 w-7"
                                                                    onClick={() =>
                                                                        handleCopy(
                                                                            "requestBody",
                                                                            cleanedRequestBody
                                                                        )
                                                                    }
                                                                >
                                                                    {copiedItem ===
                                                                    "requestBody" ? (
                                                                        <Check className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <Copy className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>
                                                                    {t(
                                                                        "share_page.copy_body"
                                                                    )}
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <CodeEditor
                                                            value={
                                                                cleanedRequestBody
                                                            }
                                                            readOnly
                                                            language="json"
                                                        />
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground p-4">
                                                        {t(
                                                            "share_page.no_body"
                                                        )}
                                                    </p>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            {t("share_page.response_title")}
                                        </CardTitle>
                                        {response && (
                                            <div className="flex items-center gap-4 text-sm pt-2">
                                                <span>
                                                    {t("main.time_label")}:{" "}
                                                    <span className="font-semibold text-blue-500">
                                                        {response.time} ms
                                                    </span>
                                                </span>
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent>
                                        {response ? (
                                            <Tabs
                                                defaultValue={
                                                    showPreviewTab
                                                        ? "preview"
                                                        : "body"
                                                }
                                            >
                                                <TabsList>
                                                    {showPreviewTab && (
                                                        <TabsTrigger value="preview">
                                                            {t(
                                                                "share_page.preview_tab"
                                                            )}
                                                        </TabsTrigger>
                                                    )}
                                                    <TabsTrigger value="body">
                                                        {t(
                                                            "share_page.body_tab"
                                                        )}
                                                    </TabsTrigger>
                                                    <TabsTrigger value="headers">
                                                        {t(
                                                            "share_page.headers_tab"
                                                        )}
                                                    </TabsTrigger>
                                                </TabsList>
                                                {showPreviewTab && (
                                                    <TabsContent
                                                        value="preview"
                                                        className="mt-2 h-96 bg-white rounded-md"
                                                    >
                                                        <ResponsePreview
                                                            response={response}
                                                        />
                                                    </TabsContent>
                                                )}
                                                <TabsContent
                                                    value="body"
                                                    className="mt-2 h-96 relative"
                                                >
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="absolute top-0 right-0 z-10 h-7 w-7"
                                                                onClick={() =>
                                                                    handleCopy(
                                                                        "responseBody",
                                                                        cleanedResponseBody
                                                                    )
                                                                }
                                                            >
                                                                {copiedItem ===
                                                                "responseBody" ? (
                                                                    <Check className="h-4 w-4 text-green-500" />
                                                                ) : (
                                                                    <Copy className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>
                                                                {t(
                                                                    "share_page.copy_body"
                                                                )}
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <CodeEditor
                                                        value={
                                                            cleanedResponseBody
                                                        }
                                                        readOnly
                                                        language={
                                                            response.contentType?.includes(
                                                                "html"
                                                            )
                                                                ? "html"
                                                                : "json"
                                                        }
                                                    />
                                                </TabsContent>
                                                <TabsContent
                                                    value="headers"
                                                    className="mt-2 h-96 overflow-y-auto"
                                                >
                                                    <ResponseHeaders
                                                        headers={
                                                            response.headers
                                                        }
                                                    />
                                                </TabsContent>
                                            </Tabs>
                                        ) : (
                                            <div className="h-full flex items-center justify-center border rounded-md bg-muted/20">
                                                <p className="text-muted-foreground">
                                                    {t(
                                                        "share_page.no_response"
                                                    )}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </main>
                        <footer className="container mx-auto text-center py-6 mt-auto border-t">
                            <p className="text-sm text-muted-foreground">
                                {t("share_page.footer_text_start")}
                                <a
                                    href="/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-primary hover:underline"
                                >
                                    {" "}
                                    Nextman API{" "}
                                </a>
                                &mdash; {t("share_page.footer_text_end")}
                            </p>
                        </footer>
                    </>
                )}
            </div>
        </TooltipProvider>
    );
}

// --- КОМПОНЕНТ-ОБЕРТКА ДЛЯ ПРОВАЙДЕРОВ ---
export function ReadOnlyPage({ requestTab, shareName }: ReadOnlyPageProps) {
    const { t } = useTranslation();

    const pageTitle =
        shareName || requestTab.name || t("share_page.default_title");

    if (!requestTab || typeof requestTab !== "object") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
                <ServerCrash className="h-16 w-16 text-destructive mb-4" />
                <h1 className="text-2xl font-bold">
                    {t("share_page.error_title")}
                </h1>
                <p className="text-muted-foreground">
                    {pageTitle}
                    {t("share_page.error_description")}
                </p>
                <Button asChild className="mt-6">
                    <a href="/">{t("share_page.back_button")}</a>
                </Button>
            </div>
        );
    }
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <I18nProvider>
                <SharedRequestViewer
                    requestTab={requestTab}
                    pageTitle={pageTitle}
                />
            </I18nProvider>
        </ThemeProvider>
    );
}

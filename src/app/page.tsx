"use client";

import { Button } from "@/components/ui/button";
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
import {
    KeyValueEditor,
    KeyValuePair,
} from "@/components/core/key-value-editor";
import { useTabsStore, ResponseData } from "@/store/tabs";
import { cn } from "@/lib/utils";
import { X, Plus, ExternalLink } from "lucide-react";
import { HistorySidebar } from "@/components/history/history-sidebar";
import { useEffect, useState } from "react";
import { ResponseHeaders } from "@/components/response/response-headers";
import { AuthButton } from "@/components/auth/auth-button";
import { CollectionsSidebar } from "@/components/collections/collections-sidebar";
import { SaveRequestDialog } from "@/components/collections/save-request-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { EnvironmentManager } from "@/components/environment/environment-manager";
import { CodeGenerationDialog } from "@/components/code-gen/code-generation-dialog";
import { ThemeToggle } from "@/components/core/theme-toggle";
import { VariableInput } from "@/components/environment/variable-input";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthEditor } from "@/components/auth/auth-editor";
import { ShareButton } from "@/components/share/share-button";
import { ManageShares } from "@/components/share/manage-shares";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SettingsDropdown } from "@/components/core/settings-dropdown";
// import { Loader } from "@/components/core/loader";
import { HomePageSkeleton } from "@/components/core/homepage-skeleton";

const CodeEditor = dynamic(
    () => import("@/components/core/editor").then((mod) => mod.CodeEditor),
    {
        ssr: false,
        loading: () => <Skeleton className="w-full h-full" />,
    }
);

function ResponsePreview({ response }: { response: ResponseData }) {
    const { t } = useTranslation();

    const xFrameOptions = response.headers["x-frame-options"];

    if (
        xFrameOptions &&
        (xFrameOptions.toLowerCase() === "deny" ||
            xFrameOptions.toLowerCase() === "sameorigin")
    ) {
        return (
            <div className="p-4 text-center flex flex-col items-center justify-center h-full">
                <h3 className="font-semibold">
                    {t("previews.preview_blocked_title")}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                    {t("previews.preview_blocked_description")}
                </p>

                <Button
                    variant="secondary"
                    className="mt-4"
                    onClick={() => {
                        const blob = new Blob([response.rawBody], {
                            type: response.contentType || "text/html",
                        });
                        const url = URL.createObjectURL(blob);
                        window.open(url, "_blank");
                    }}
                >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {t("previews.open_in_new_tab")}
                </Button>
            </div>
        );
    }

    if (!response.contentType) {
        return (
            <div className="p-4 text-muted-foreground">
                {t("previews.no_preview_available")}
            </div>
        );
    }

    const base64ToBlobUrl = (base64: string, contentType: string) => {
        try {
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: contentType });
            return URL.createObjectURL(blob);
        } catch (e) {
            console.error("Failed to decode Base64 string", e);
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

    if (response.contentType.includes("text/html") && !response.isBase64) {
        const htmlBlob = new Blob([response.rawBody], { type: "text/html" });
        const htmlUrl = URL.createObjectURL(htmlBlob);
        return (
            <PreviewContainer url={htmlUrl}>
                <iframe
                    src={htmlUrl}
                    className="w-full h-full border-0"
                    sandbox=""
                />
            </PreviewContainer>
        );
    }

    if (response.contentType.includes("image/svg+xml") && !response.isBase64) {
        const svgBlob = new Blob([response.rawBody], { type: "image/svg+xml" });
        const svgUrl = URL.createObjectURL(svgBlob);
        return (
            <PreviewContainer url={svgUrl}>
                <div className="w-full h-96 flex items-center justify-center p-4 bg-white">
                    <img
                        src={svgUrl}
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
                    <div className="w-full h-96 flex items-center justify-center p-4 bg-muted">
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
                    <iframe src={url} className="w-full h-96 border-0" />
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

const MAX_TABS = 100;

export default function HomePage() {
    const {
        tabs,
        activeTabId,
        addTab: zustandAddTab,
        closeTab,
        setActiveTab,
        updateActiveTab,
        sendRequest,
        init,
    } = useTabsStore();

    const [isStoreInitialized, setIsStoreInitialized] = useState(false);

    const { t } = useTranslation();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [editingTabId, setEditingTabId] = useState<string | null>(null);

    const [isMounted, setIsMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const logoSrc =
        resolvedTheme === "dark"
            ? "/nextman-logo-light.png"
            : "/nextman-logo-dark.png";

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useHotkeys([["ctrl+enter", () => sendRequest()]]);
    useHotkeys([["cmd+enter", () => sendRequest()]]);

    useEffect(() => {
        if (init) init();

        const supabase = createClient();
        const getUserAndSetupListener = async () => {
            if (init) {
                init();
                setIsStoreInitialized(true);
            }

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

    const activeTab = tabs.find((tab) => tab.id === activeTabId);

    const handleUrlChange = (url: string) =>
        updateActiveTab({ url, isDirty: true });
    const handleMethodChange = (method: string) =>
        updateActiveTab({ method, isDirty: true });
    const handleBodyChange = (body: string | undefined) =>
        updateActiveTab({ body: body || "", isDirty: true });
    const handleQueryParamsChange = (queryParams: KeyValuePair[]) =>
        updateActiveTab({ queryParams, isDirty: true });
    const handleHeadersChange = (headers: KeyValuePair[]) =>
        updateActiveTab({ headers, isDirty: true });

    const handleAddTab = () => {
        if (tabs.length >= MAX_TABS) {
            toast({
                title: t("toasts.tab_limit_reached_title"),
                description: t("toasts.tab_limit_reached_description", {
                    max: MAX_TABS,
                }),
                variant: "destructive",
            });
        } else {
            zustandAddTab();
        }
    };

    if (!isStoreInitialized || !activeTab) {
        if (isStoreInitialized && tabs.length === 0) {
            return (
                <div className="flex flex-col h-screen bg-background text-foreground">
                    <main className="flex items-center justify-center flex-grow">
                        <Button onClick={handleAddTab}>
                            {t("main.create_request_button")}
                        </Button>
                    </main>
                </div>
            );
        }

        return <HomePageSkeleton />;
    }

    if (!activeTab) {
        return (
            <div className="flex flex-col h-screen bg-background text-foreground">
                <header className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                        {isMounted ? (
                            <Image
                                src={logoSrc}
                                alt="Nextman Logo"
                                width={46}
                                height={46}
                                key={logoSrc}
                            />
                        ) : (
                            <div className="skeleton w-7 h-7 rounded-sm"></div>
                        )}
                        <h1 className="text-xl font-bold">
                            {t("header.title")}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                        <EnvironmentManager user={user} />
                        <HistorySidebar user={user} />
                        <ShareButton user={user} />

                        <div className="w-px h-6 bg-border mx-2"></div>

                        <SettingsDropdown user={user} />

                        <AuthButton />
                    </div>
                </header>
                <main className="flex items-center justify-center flex-grow">
                    <Button onClick={handleAddTab}>
                        {t("main.create_request_button")}
                    </Button>
                </main>
            </div>
        );
    }

    const response = activeTab.response;
    const showPreviewTab =
        response?.contentType &&
        (response.contentType.includes("text/html") ||
            response.contentType.startsWith("image/") ||
            response.contentType.includes("application/pdf") ||
            response.contentType.includes("application/xml") ||
            response.contentType.includes("image/svg+xml"));

    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <header className="p-4 border-b flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                    {isMounted ? (
                        <Image
                            src={logoSrc}
                            alt="Nextman Logo"
                            width={46}
                            height={46}
                            key={logoSrc}
                        />
                    ) : (
                        <div className="skeleton w-7 h-7 rounded-sm"></div>
                    )}
                    <h1 className="text-xl font-bold">{t("header.title")}</h1>
                </div>
                <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                    <EnvironmentManager user={user} />
                    <HistorySidebar user={user} />
                    <ShareButton user={user} />

                    <div className="w-px h-6 bg-border mx-2"></div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                title={t("common.settings")}
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end">
                            <DropdownMenuGroup>
                                <div className="p-1">
                                    <LanguageSwitcher />
                                </div>
                                <div className="p-1">
                                    <ThemeToggle />
                                </div>
                                <div className="p-1">
                                    <CodeGenerationDialog />
                                </div>
                                <div className="p-1">
                                    <ManageShares user={user} />
                                </div>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <AuthButton />
                </div>
            </header>

            <div className="flex items-center border-b bg-muted/40 p-1 gap-1 overflow-x-auto overflow-y-hidden">
                {tabs.map((tab) => {
                    const displayName =
                        tab.name === "tabs.untitled_request"
                            ? t("tabs.untitled_request")
                            : tab.name;

                    const isEditing = editingTabId === tab.id;

                    return (
                        <div
                            key={tab.id}
                            className={cn(
                                "h-8 px-2 relative flex-shrink-0 flex items-center rounded-md group",
                                activeTabId === tab.id
                                    ? "bg-background shadow-sm"
                                    : "hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <div
                                onClick={() => {
                                    if (!isEditing) setActiveTab(tab.id);
                                }}
                                className="flex items-center cursor-pointer flex-grow h-full pr-2"
                            >
                                <AnimatePresence>
                                    {tab.isDirty && (
                                        <motion.span
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.2 }}
                                            className="mr-2 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"
                                        />
                                    )}
                                </AnimatePresence>

                                <span
                                    className={cn(
                                        "text-xs font-semibold",
                                        tab.method === "GET" &&
                                            "text-green-500",
                                        tab.method === "POST" &&
                                            "text-yellow-500",
                                        tab.method === "PUT" && "text-blue-500",
                                        tab.method === "DELETE" &&
                                            "text-red-500"
                                    )}
                                >
                                    {tab.method}
                                </span>

                                {isEditing ? (
                                    <Input
                                        type="text"
                                        defaultValue={
                                            tab.name === "tabs.untitled_request"
                                                ? ""
                                                : tab.name
                                        }
                                        onBlur={(e) => {
                                            const newName =
                                                e.target.value.trim();

                                            updateActiveTab({
                                                name:
                                                    newName ||
                                                    "tabs.untitled_request",
                                                isDirty: true,
                                            });
                                            setEditingTabId(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" ||
                                                e.key === "Escape"
                                            ) {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                        className="h-6 text-xs ml-2 w-32 bg-background"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={() =>
                                            setEditingTabId(tab.id)
                                        }
                                        className="text-xs ml-2"
                                    >
                                        {displayName}
                                    </span>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation();
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
                    );
                })}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 flex-shrink-0"
                    onClick={() => handleAddTab()}
                    disabled={tabs.length >= MAX_TABS}
                >
                    <Plus className="h-4 w-4" />
                </Button>

                <span className="text-xs text-muted-foreground ml-2">
                    ({tabs.length}/{MAX_TABS})
                </span>
            </div>

            <ResizablePanelGroup direction="horizontal" className="flex-grow">
                <ResizablePanel defaultSize={20} minSize={15}>
                    <CollectionsSidebar />
                </ResizablePanel>

                <ResizableHandle withHandle />

                <ResizablePanel defaultSize={80}>
                    <main className="h-full p-4">
                        <ResizablePanelGroup
                            direction="vertical"
                            className="h-full"
                        >
                            <ResizablePanel defaultSize={40} minSize={20}>
                                <div className="p-4 h-full flex flex-col gap-4">
                                    <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
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
                                        <VariableInput
                                            type="text"
                                            value={activeTab.url}
                                            onChange={(e) =>
                                                handleUrlChange(e.target.value)
                                            }
                                            placeholder="https://api.example.com"
                                            className="flex-grow"
                                        />
                                        <SaveRequestDialog />
                                        <Button
                                            onClick={sendRequest}
                                            disabled={activeTab.loading}
                                        >
                                            {activeTab.loading
                                                ? t("main.sending_button")
                                                : t("main.send_button")}
                                        </Button>
                                    </div>
                                    <Tabs
                                        defaultValue="params"
                                        className="flex-grow flex flex-col"
                                    >
                                        <TabsList>
                                            <TabsTrigger value="params">
                                                {t("main.query_params_tab")}
                                            </TabsTrigger>
                                            <TabsTrigger value="headers">
                                                {t("main.headers_tab")}
                                            </TabsTrigger>
                                            <TabsTrigger value="auth">
                                                {t("main.auth_tab")}
                                            </TabsTrigger>
                                            <TabsTrigger value="body">
                                                {t("main.body_tab")}
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent
                                            value="params"
                                            className="mt-4"
                                        >
                                            <KeyValueEditor
                                                pairs={activeTab.queryParams}
                                                onPairsChange={
                                                    handleQueryParamsChange
                                                }
                                                placeholderKey={t(
                                                    "kv_editor.param_key"
                                                )}
                                                placeholderValue={t(
                                                    "kv_editor.param_value"
                                                )}
                                            />
                                        </TabsContent>
                                        <TabsContent
                                            value="headers"
                                            className="mt-4"
                                        >
                                            <KeyValueEditor
                                                pairs={activeTab.headers}
                                                onPairsChange={
                                                    handleHeadersChange
                                                }
                                                placeholderKey={t(
                                                    "kv_editor.header_key"
                                                )}
                                                placeholderValue={t(
                                                    "kv_editor.header_value"
                                                )}
                                            />
                                        </TabsContent>

                                        <TabsContent value="auth">
                                            <AuthEditor />
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

                            <ResizablePanel defaultSize={60} minSize={20}>
                                <div className="p-4 h-full flex flex-col">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-lg font-semibold">
                                            {t("main.response_title")}
                                        </h2>
                                        {activeTab.response && (
                                            <div className="flex items-center gap-4 text-sm">
                                                <span>
                                                    {t("main.status_label")}:{" "}
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
                                                    {t("main.time_label")}:{" "}
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

                                    <AnimatePresence mode="wait">
                                        {response ? (
                                            <motion.div
                                                key="response-data"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="flex-grow flex flex-col min-h-0"
                                            >
                                                <Tabs
                                                    defaultValue={
                                                        showPreviewTab
                                                            ? "preview"
                                                            : "body"
                                                    }
                                                    className="flex-grow flex flex-col"
                                                >
                                                    <TabsList>
                                                        {showPreviewTab && (
                                                            <TabsTrigger value="preview">
                                                                {t(
                                                                    "main.response_preview_tab"
                                                                )}
                                                            </TabsTrigger>
                                                        )}
                                                        <TabsTrigger value="body">
                                                            {t(
                                                                "main.response_body_tab"
                                                            )}
                                                        </TabsTrigger>
                                                        <TabsTrigger value="headers">
                                                            {t(
                                                                "main.response_headers_tab"
                                                            )}
                                                        </TabsTrigger>
                                                    </TabsList>

                                                    {showPreviewTab && (
                                                        <TabsContent
                                                            value="preview"
                                                            className="mt-4 flex-grow bg-white rounded-md"
                                                        >
                                                            <ResponsePreview
                                                                response={
                                                                    response
                                                                }
                                                            />
                                                        </TabsContent>
                                                    )}

                                                    <TabsContent
                                                        value="body"
                                                        className="mt-4 flex-grow"
                                                    >
                                                        <CodeEditor
                                                            value={
                                                                response.body
                                                            }
                                                            readOnly={true}
                                                            key={
                                                                activeTab.id +
                                                                response.body
                                                            }
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
                                                        className="mt-4 overflow-y-auto"
                                                    >
                                                        <ResponseHeaders
                                                            headers={
                                                                response.headers
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
                                                        ? t(
                                                              "main.response_waiting"
                                                          )
                                                        : t(
                                                              "main.response_placeholder"
                                                          )}
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

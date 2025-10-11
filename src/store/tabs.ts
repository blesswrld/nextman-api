import { create } from "zustand";
import { KeyValuePair } from "@/components/core/key-value-editor";
import { addHistoryItem } from "@/lib/history-db";
import { createClient } from "@/lib/supabase/client";
import i18n from "@/../i18n";
import { useEnvironmentsStore } from "./environments";

const MAX_TABS = 100;

export interface AuthState {
    type: AuthType;
    token?: string;
    key?: string;
    value?: string;
    in?: "header" | "query";
    username?: string;
    password?: string;
}

export interface ResponseData {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    rawBody: string;
    contentType: string | null;
    time: number;
    isBase64: boolean;
}

export interface RequestTab {
    id: string;
    name: string;
    method: string;
    url: string;
    queryParams: KeyValuePair[];
    headers: KeyValuePair[];
    body: string;
    auth: AuthState;
    response: ResponseData | null;
    loading: boolean;
    isDirty?: boolean;
}

interface TabsState {
    tabs: RequestTab[];
    activeTabId: string | null;

    addTab: (data?: Partial<RequestTab>) => void;
    setActiveTab: (id: string) => void;
    closeTab: (id: string) => void;
    updateActiveTab: (data: Partial<Omit<RequestTab, "id">>) => void;
    sendRequest: () => Promise<void>;

    init?: () => void;
}

export type AuthType = "none" | "bearer" | "apiKey" | "basic";

const createNewTab = (data?: Partial<RequestTab>): RequestTab => ({
    id: crypto.randomUUID(),
    name: data?.name || i18n.t("tabs.untitled_request"),
    method: data?.method || "GET",
    url: data?.url || "https://jsonplaceholder.typicode.com/todos/1",
    queryParams: data?.queryParams || [
        { id: crypto.randomUUID(), key: "", value: "" },
    ],
    headers: data?.headers || [{ id: crypto.randomUUID(), key: "", value: "" }],
    body: data?.body || "",
    auth: data?.auth || { type: "none" },
    response: null,
    loading: data?.loading || false,
    isDirty: data?.isDirty === undefined ? false : data.isDirty,
    ...data,
});

const buildUrlWithParams = (url: string, queryParams: KeyValuePair[]) => {
    const activeParams = queryParams.filter((p) => p.key);
    if (activeParams.length === 0) {
        return url;
    }
    const params = new URLSearchParams();
    activeParams.forEach((p) => params.append(p.key, p.value));
    const [baseUrl] = url.split("?");
    return `${baseUrl}?${params.toString()}`;
};

const buildHeadersObject = (headers: KeyValuePair[]) => {
    const activeHeaders = headers.filter((h) => h.key);
    const headersObj: Record<string, string> = {};
    activeHeaders.forEach((h) => {
        headersObj[h.key] = h.value;
    });
    return headersObj;
};

const applyEnvironmentVariables = (text: string): string => {
    const activeEnv = useEnvironmentsStore.getState().activeEnvironment;
    if (!activeEnv || !activeEnv.variables) {
        return text;
    }
    let newText = text;
    const variables = activeEnv.variables as Record<string, string>;
    for (const key in variables) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        newText = newText.replace(regex, variables[key]);
    }
    return newText;
};

const applyAuth = (
    headers: KeyValuePair[],
    queryParams: KeyValuePair[],
    auth: AuthState
): { finalHeaders: KeyValuePair[]; finalQueryParams: KeyValuePair[] } => {
    let finalHeaders = [...headers];
    let finalQueryParams = [...queryParams];

    finalHeaders = finalHeaders.filter(
        (h) => h.key.toLowerCase() !== "authorization"
    );

    if (auth.type === "bearer" && auth.token) {
        finalHeaders.push({
            id: crypto.randomUUID(),
            key: "Authorization",
            value: `Bearer ${auth.token}`,
        });
    }

    if (auth.type === "apiKey" && auth.key && auth.value) {
        if (auth.in === "header") {
            finalHeaders.push({
                id: crypto.randomUUID(),
                key: auth.key,
                value: auth.value,
            });
        } else {
            finalQueryParams.push({
                id: crypto.randomUUID(),
                key: auth.key,
                value: auth.value,
            });
        }
    }

    if (auth.type === "basic" && auth.username) {
        const encoded = btoa(`${auth.username}:${auth.password || ""}`);
        finalHeaders.push({
            id: crypto.randomUUID(),
            key: "Authorization",
            value: `Basic ${encoded}`,
        });
    }

    return { finalHeaders, finalQueryParams };
};

export const useTabsStore = create<TabsState>((set, get) => ({
    tabs: [createNewTab()],
    activeTabId: null,

    init: () => {
        set((state) => ({ activeTabId: state.tabs[0]?.id || null }));
    },

    addTab: (data?: Partial<RequestTab>) => {
        const state = get();
        if (state.tabs.length >= MAX_TABS) {
            console.warn(`Tab limit of ${MAX_TABS} reached.`);
            return;
        }

        const newTab = createNewTab(data);
        set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
        }));
    },

    setActiveTab: (id) => {
        set({ activeTabId: id });
    },

    closeTab: (id) => {
        set((state) => {
            const newTabs = state.tabs.filter((tab) => tab.id !== id);
            let newActiveTabId = state.activeTabId;

            if (state.activeTabId === id) {
                const closingTabIndex = state.tabs.findIndex(
                    (tab) => tab.id === id
                );
                newActiveTabId =
                    newTabs[closingTabIndex - 1]?.id || newTabs[0]?.id || null;
            }

            if (newTabs.length === 0) {
                const newTab = createNewTab();
                return { tabs: [newTab], activeTabId: newTab.id };
            }

            return { tabs: newTabs, activeTabId: newActiveTabId };
        });
    },

    updateActiveTab: (data) => {
        set((state) => ({
            tabs: state.tabs.map((tab) =>
                tab.id === state.activeTabId ? { ...tab, ...data } : tab
            ),
        }));
    },

    sendRequest: async () => {
        const { activeTabId, tabs, updateActiveTab } = get();
        const activeTab = tabs.find((tab) => tab.id === activeTabId);
        if (!activeTab) return;

        updateActiveTab({ loading: true, response: null });
        const startTime = performance.now();

        try {
            const {
                finalHeaders: headersWithAuth,
                finalQueryParams: queryParamsWithAuth,
            } = applyAuth(
                activeTab.headers,
                activeTab.queryParams,
                activeTab.auth
            );

            const processedUrl = applyEnvironmentVariables(activeTab.url);
            const processedBody = applyEnvironmentVariables(activeTab.body);
            const processedHeaders = headersWithAuth.map((h) => ({
                ...h,
                value: applyEnvironmentVariables(h.value),
            }));
            const processedQueryParams = queryParamsWithAuth.map((p) => ({
                ...p,
                value: applyEnvironmentVariables(p.value),
            }));

            let parsedBody: string | undefined = undefined;
            if (
                ["POST", "PUT", "PATCH"].includes(activeTab.method) &&
                processedBody.trim() !== ""
            ) {
                try {
                    JSON.parse(processedBody);
                    parsedBody = processedBody;
                } catch (e) {
                    throw new Error("Invalid JSON in request body");
                }
            }

            const finalUrl = buildUrlWithParams(
                processedUrl,
                processedQueryParams
            );
            const finalHeadersObject = buildHeadersObject(processedHeaders);

            const res = await fetch("/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: finalUrl,
                    method: activeTab.method,
                    headers: finalHeadersObject,
                    body: parsedBody,
                }),
            });

            const endTime = performance.now();
            const requestTime = Math.round(endTime - startTime);
            const dataFromProxy = await res.json();

            if (!res.ok) {
                throw {
                    response: {
                        status: dataFromProxy.status || 500,
                        statusText: dataFromProxy.statusText || "Proxy Error",
                        headers: {},
                        body: JSON.stringify(dataFromProxy, null, 2),
                        rawBody: JSON.stringify(dataFromProxy),
                        contentType: "application/json",
                        time: requestTime,
                        isBase64: false,
                    },
                    message: dataFromProxy.error || "Proxy request failed",
                };
            }

            const contentType = dataFromProxy.headers["content-type"] || null;
            const rawBody = dataFromProxy.body;
            let formattedBody = rawBody;

            if (contentType && contentType.includes("application/json")) {
                try {
                    formattedBody = JSON.stringify(
                        JSON.parse(rawBody),
                        null,
                        2
                    );
                } catch (e) {}
            }

            let finalTabName = activeTab.name;
            if (activeTab.name === "tabs.untitled_request") {
                const cleanUrl = activeTab.url.replace(
                    /^(https?:\/\/)?(www\.)?/,
                    ""
                );
                finalTabName = `${activeTab.method} ${cleanUrl
                    .split("?")[0]
                    .slice(0, 25)}...`;
            }

            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                await addHistoryItem({
                    url: activeTab.url,
                    method: activeTab.method,
                    name: finalTabName,
                });
            }

            const responseData: ResponseData = {
                status: dataFromProxy.status,
                statusText: dataFromProxy.statusText,
                headers: dataFromProxy.headers,
                body: formattedBody,
                rawBody: rawBody,
                contentType: contentType,
                time: requestTime,
                isBase64: dataFromProxy.isBase64,
            };

            updateActiveTab({
                response: responseData,
                name: finalTabName,
                isDirty: false,
            });
            // @ts-ignore
        } catch (error: any) {
            const endTime = performance.now();
            const requestTime = Math.round(endTime - startTime);

            if (error.response) {
                updateActiveTab({ response: error.response });
                return;
            }

            const errorResponse: ResponseData = {
                status: 0,
                statusText: "Client Error",
                headers: {},
                body: JSON.stringify(
                    { error: error.message || "An unknown error occurred" },
                    null,
                    2
                ),
                rawBody: JSON.stringify({
                    error: error.message || "An unknown error occurred",
                }),
                contentType: "application/json",
                time: requestTime,
                isBase64: false,
            };
            updateActiveTab({ response: errorResponse });
        } finally {
            updateActiveTab({ loading: false });
        }
    },
}));

if (typeof window !== "undefined") {
    useTabsStore.getState().init?.();
}

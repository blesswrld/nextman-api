import { create } from "zustand";
import { KeyValuePair } from "@/components/key-value-editor";
import { addHistoryItem } from "@/lib/history-db";

// Описываем тип одной вкладки
export interface RequestTab {
    id: string;
    name: string;
    method: string;
    url: string;
    queryParams: KeyValuePair[];
    headers: KeyValuePair[];
    body: string;
    response: string;
    loading: boolean;
}

// Описываем тип всего нашего хранилища
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

// Функция для создания новой пустой вкладки
const createNewTab = (data?: Partial<RequestTab>): RequestTab => ({
    id: crypto.randomUUID(),
    name: data?.name || "Untitled Request",
    method: data?.method || "GET",
    url: data?.url || "https://jsonplaceholder.typicode.com/todos/1",
    queryParams: data?.queryParams || [
        { id: crypto.randomUUID(), key: "", value: "" },
    ],
    headers: data?.headers || [{ id: crypto.randomUUID(), key: "", value: "" }],
    body: data?.body || "",
    response: data?.response || "",
    loading: data?.loading || false,
    ...data,
});

// Функция для сборки URL с параметрами
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

// Функция для преобразования заголовков в объект
const buildHeadersObject = (headers: KeyValuePair[]) => {
    const activeHeaders = headers.filter((h) => h.key);
    const headersObj: Record<string, string> = {};
    activeHeaders.forEach((h) => {
        headersObj[h.key] = h.value;
    });
    return headersObj;
};

export const useTabsStore = create<TabsState>((set, get) => ({
    tabs: [createNewTab()],
    activeTabId: null,

    init: () => {
        set((state) => ({ activeTabId: state.tabs[0]?.id || null }));
    },

    addTab: (data?: Partial<RequestTab>) => {
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
                return {
                    tabs: [newTab],
                    activeTabId: newTab.id,
                };
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

        updateActiveTab({ loading: true, response: "" });

        try {
            let parsedBody: string | undefined = undefined;
            if (
                ["POST", "PUT", "PATCH"].includes(activeTab.method) &&
                activeTab.body.trim() !== ""
            ) {
                try {
                    // Просто проверяем, что JSON валидный, и передаем его как строку
                    JSON.parse(activeTab.body);
                    parsedBody = activeTab.body;
                } catch (e) {
                    throw new Error("Invalid JSON in request body");
                }
            }

            const finalUrl = buildUrlWithParams(
                activeTab.url,
                activeTab.queryParams
            );
            const finalHeaders = buildHeadersObject(activeTab.headers);

            const res = await fetch("/api/proxy", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url: finalUrl,
                    method: activeTab.method,
                    headers: finalHeaders,
                    body: parsedBody, // Передаем тело как строку
                }),
            });

            if (!res.ok)
                throw new Error(
                    `Proxy request failed: ${res.status} ${res.statusText}`
                );
            const data = await res.json();
            let formattedBody = data.body;
            try {
                formattedBody = JSON.stringify(JSON.parse(data.body), null, 2);
            } catch (e) {}
            data.body = formattedBody;

            updateActiveTab({ response: JSON.stringify(data, null, 2) });

            await addHistoryItem({
                url: activeTab.url,
                method: activeTab.method,
            });
        } catch (error) {
            const errorResponse =
                error instanceof Error
                    ? { error: error.message }
                    : { error: "An unknown error occurred" };
            updateActiveTab({
                response: JSON.stringify(errorResponse, null, 2),
            });
        } finally {
            updateActiveTab({ loading: false });
        }
    },
}));

// Вызываем инициализацию сразу после создания стора
useTabsStore.getState().init?.();

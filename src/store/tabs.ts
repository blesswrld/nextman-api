import { create } from "zustand";
import { KeyValuePair } from "@/components/key-value-editor";
import { addHistoryItem } from "@/lib/history-db";
import { createClient } from "@/lib/supabase/client";
import i18n from "../../i18n"; // <-- ИМПОРТ

// Описываем тип одной вкладки
export interface RequestTab {
    id: string;
    name: string;
    method: string;
    url: string;
    queryParams: KeyValuePair[];
    headers: KeyValuePair[];
    body: string;
    response: ResponseData | null;
    loading: boolean;
    isDirty?: boolean;
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

export interface ResponseData {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string; // Тело ответа уже отформатировано
    time: number; // Время выполнения в мс
}

// Функция для создания новой пустой вкладки
const createNewTab = (data?: Partial<RequestTab>): RequestTab => ({
    id: crypto.randomUUID(),
    // Используем `i18n.t` для получения перевода
    name: data?.name || i18n.t("tabs.untitled_request"),
    method: data?.method || "GET",
    url: data?.url || "https://jsonplaceholder.typicode.com/todos/1",
    queryParams: data?.queryParams || [
        { id: crypto.randomUUID(), key: "", value: "" },
    ],
    headers: data?.headers || [{ id: crypto.randomUUID(), key: "", value: "" }],
    body: data?.body || "",
    response: null,
    loading: data?.loading || false,
    isDirty: data?.isDirty === undefined ? false : data.isDirty,
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
        // Проверяем, было ли поле isDirty передано явно. Если нет, ставим true.
        const isDirty = data.isDirty === undefined ? true : data.isDirty;
        set((state) => ({
            tabs: state.tabs.map((tab) =>
                tab.id === state.activeTabId
                    ? { ...tab, ...data, isDirty }
                    : tab
            ),
        }));
    },

    sendRequest: async () => {
        const { activeTabId, tabs, updateActiveTab } = get();
        const activeTab = tabs.find((tab) => tab.id === activeTabId);
        if (!activeTab) return;

        updateActiveTab({ loading: true, response: null, isDirty: false }); // Сбрасываем isDirty в начале
        const startTime = performance.now(); // Засекаем время начала

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
                    body: parsedBody,
                }),
            });

            const endTime = performance.now(); // Засекаем время окончания
            const requestTime = Math.round(endTime - startTime);

            const data = await res.json();

            if (!res.ok) {
                // Если прокси вернул ошибку, создаем "фейковый" объект ответа
                throw {
                    response: {
                        status: data.status || 500,
                        statusText: data.statusText || "Proxy Error",
                        headers: {},
                        body: JSON.stringify(data, null, 2),
                        time: requestTime,
                    },
                    message: data.error || "Proxy request failed",
                };
            }

            // 1. Определяем, какое имя использовать для истории и обновления вкладки
            let finalTabName = activeTab.name;
            if (activeTab.name === "Untitled Request") {
                const cleanUrl = activeTab.url.replace(
                    /^(https?:\/\/)?(www\.)?/,
                    ""
                );
                finalTabName = `${activeTab.method} ${cleanUrl
                    .split("?")[0]
                    .slice(0, 25)}...`;
            }

            // 2. Сохраняем в историю с правильным (возможно, новым) именем, только если пользователь авторизован
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

            // 3. Обновляем вкладку, включая ответ и новое имя
            let formattedBody = data.body;
            try {
                formattedBody = JSON.stringify(JSON.parse(data.body), null, 2);
            } catch (e) {}

            const responseData: ResponseData = {
                status: data.status,
                statusText: data.statusText,
                headers: data.headers,
                body: formattedBody,
                time: requestTime,
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

            // Если ошибка уже содержит объект ответа, используем его
            if (error.response) {
                updateActiveTab({ response: error.response, isDirty: false });
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
                time: requestTime,
            };
            updateActiveTab({ response: errorResponse, isDirty: false });
        } finally {
            updateActiveTab({ loading: false, isDirty: false });
        }
    },
}));

// Вызываем инициализацию сразу после создания стора
useTabsStore.getState().init?.();

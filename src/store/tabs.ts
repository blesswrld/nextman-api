import { create } from "zustand";
import { KeyValuePair } from "@/components/key-value-editor";
import { addHistoryItem } from "@/lib/history-db";
import { createClient } from "@/lib/supabase/client";
import i18n from "../../i18n"; // <-- ИМПОРТ
import { useEnvironmentsStore } from "./environments";

// Описываем более подробный формат объекта ответа
export interface ResponseData {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string; // Тело ответа, отформатированное для вкладки "Body"
    rawBody: string; // "Сырое", оригинальное тело ответа для вкладки "Preview"
    contentType: string | null; // Заголовок Content-Type для определения, как рендерить превью
    time: number; // Время выполнения запроса в мс
    isBase64: boolean;
}

// Описываем тип одной вкладки, теперь используем новый тип ResponseData
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

export interface AuthState {
    type: AuthType;
    // Поля для разных типов авторизации
    token?: string; // для Bearer Token
    key?: string; // для API Key
    value?: string; // для API Key
    in?: "header" | "query"; // где находится API Key
    username?: string; // для Basic Auth
    password?: string; // для Basic Auth
}

// --- ТИПЫ ДЛЯ АВТОРИЗАЦИИ ---
export type AuthType = "none" | "bearer" | "apiKey" | "basic";

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
    auth: data?.auth || { type: "none" },
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

// Функция для подстановки переменных окружения
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

// Применяет данные авторизации, изменяя заголовки или query-параметры
const applyAuth = (
    headers: KeyValuePair[],
    queryParams: KeyValuePair[],
    auth: AuthState
): { finalHeaders: KeyValuePair[]; finalQueryParams: KeyValuePair[] } => {
    let finalHeaders = [...headers];
    let finalQueryParams = [...queryParams];

    // Удаляем предыдущие "Authorization" заголовки, чтобы избежать дублей
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
            // 'query'
            finalQueryParams.push({
                id: crypto.randomUUID(),
                key: auth.key,
                value: auth.value,
            });
        }
    }

    if (auth.type === "basic" && auth.username) {
        // btoa кодирует строку в Base64. Эта функция есть во всех современных браузерах и в Node.js.
        const encoded = btoa(`${auth.username}:${auth.password || ""}`);
        finalHeaders.push({
            id: crypto.randomUUID(),
            key: "Authorization",
            value: `Basic ${encoded}`,
        });
    }

    return { finalHeaders, finalQueryParams };
};

// --- ХРАНИЛИЩЕ ZUSTAND ---
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
                return { tabs: [newTab], activeTabId: newTab.id };
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

        updateActiveTab({ loading: true, response: null, isDirty: false });
        const startTime = performance.now();

        try {
            // --- 1. ПРИМЕНЯЕМ АВТОРИЗАЦИЮ ---
            // Сначала добавляем "сырые" данные авторизации (например, заголовок с `{{token}}`)
            // к "сырым" заголовкам и параметрам из вкладки.
            const {
                finalHeaders: headersWithAuth,
                finalQueryParams: queryParamsWithAuth,
            } = applyAuth(
                activeTab.headers,
                activeTab.queryParams,
                activeTab.auth
            );

            // --- 2. ПРИМЕНЯЕМ ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ ---
            // Теперь "прогоняем" все части запроса, включая новые данные авторизации,
            // через функцию подстановки переменных.
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

            // Проверяем тело запроса
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

            // --- 3. ФОРМИРУЕМ ФИНАЛЬНЫЙ ЗАПРОС ---
            // Используем полностью обработанные данные.
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
                // Если прокси вернул ошибку, создаем "фейковый" объект ответа
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

            // Форматируем JSON только если это действительно JSON, иначе оставляем как есть
            if (contentType && contentType.includes("application/json")) {
                try {
                    formattedBody = JSON.stringify(
                        JSON.parse(rawBody),
                        null,
                        2
                    );
                } catch (e) {}
            }

            // Определяем, какое имя использовать для истории и обновления вкладки
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

            // Сохраняем в историю с правильным (возможно, новым) именем, только если пользователь авторизован
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                await addHistoryItem({
                    url: activeTab.url, // Сохраняем оригинальный URL без переменных
                    method: activeTab.method,
                    name: finalTabName,
                });
            }

            // Обновляем вкладку, включая ответ и новое имя
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
                rawBody: JSON.stringify({
                    error: error.message || "An unknown error occurred",
                }),
                contentType: "application/json",
                time: requestTime,
                isBase64: false,
            };
            updateActiveTab({ response: errorResponse, isDirty: false });
        } finally {
            updateActiveTab({ loading: false });
        }
    },
}));

// Вызываем инициализацию сразу после создания стора
if (typeof window !== "undefined") {
    useTabsStore.getState().init?.();
}

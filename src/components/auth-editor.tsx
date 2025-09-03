"use client";

import { useTabsStore } from "@/store/tabs";
import { AuthState, AuthType } from "@/store/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { VariableInput } from "./variable-input";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

export function AuthEditor() {
    const { t } = useTranslation();

    // 1. Получаем ТОЛЬКО auth и функцию обновления. Это ключ к предотвращению лишних ререндеров.
    const auth = useTabsStore(
        (state) => state.tabs.find((t) => t.id === state.activeTabId)?.auth
    );
    const updateActiveTab = useTabsStore((state) => state.updateActiveTab);

    // 2. Используем useCallback, чтобы функции не пересоздавались без необходимости
    const handleAuthDataChange = useCallback(
        (updates: Partial<AuthState>) => {
            // Мы передаем функцию, чтобы всегда работать с последней версией `auth`
            // TypeScript не сможет это проверить, поэтому используем `as any` в одном месте
            updateActiveTab({ auth: { ...(auth as any), ...updates } });
        },
        [auth, updateActiveTab]
    );

    if (!auth) return null;

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <Select
                    value={auth.type}
                    onValueChange={(type: AuthType) =>
                        handleAuthDataChange({ type })
                    }
                >
                    <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select auth type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Auth</SelectItem>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="apiKey">API Key</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {auth.type === "bearer" && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bearer-token" className="text-right">
                        Token
                    </Label>
                    <div className="col-span-3">
                        <VariableInput
                            id="bearer-token"
                            type="text"
                            placeholder="Enter your Bearer Token"
                            value={auth.token || ""}
                            onChange={(e) =>
                                handleAuthDataChange({ token: e.target.value })
                            }
                        />
                    </div>
                </div>
            )}

            {auth.type === "basic" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="basic-username" className="text-right">
                            Username
                        </Label>
                        <div className="col-span-3">
                            <VariableInput
                                id="basic-username"
                                type="text"
                                placeholder="Enter your username"
                                value={auth.username || ""}
                                onChange={(e) =>
                                    handleAuthDataChange({
                                        username: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="basic-password" className="text-right">
                            Password
                        </Label>
                        <div className="col-span-3">
                            <VariableInput
                                id="basic-password"
                                type="password"
                                placeholder="(optional)"
                                value={auth.password || ""}
                                onChange={(e) =>
                                    handleAuthDataChange({
                                        password: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                </div>
            )}

            {auth.type === "apiKey" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="api-key" className="text-right">
                            Key
                        </Label>
                        <div className="col-span-3">
                            <VariableInput
                                id="api-key"
                                type="text"
                                placeholder="e.g. X-API-Key"
                                value={auth.key || ""}
                                onChange={(e) =>
                                    handleAuthDataChange({
                                        key: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="api-value" className="text-right">
                            Value
                        </Label>
                        <div className="col-span-3">
                            <VariableInput
                                id="api-value"
                                type="text"
                                placeholder="Enter your API Key value"
                                value={auth.value || ""}
                                onChange={(e) =>
                                    handleAuthDataChange({
                                        value: e.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Add to</Label>
                        <Select
                            value={auth.in || "header"}
                            onValueChange={(val: "header" | "query") =>
                                handleAuthDataChange({ in: val })
                            }
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="header">Header</SelectItem>
                                <SelectItem value="query">
                                    Query Params
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
}

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
import { VariableInput } from "@/components/environment/variable-input";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";

export function AuthEditor() {
    const { t } = useTranslation();

    const auth = useTabsStore(
        (state) => state.tabs.find((t) => t.id === state.activeTabId)?.auth
    );
    const updateActiveTab = useTabsStore((state) => state.updateActiveTab);

    const handleAuthDataChange = useCallback(
        (updates: Partial<AuthState>) => {
            updateActiveTab({ auth: { ...(auth as any), ...updates } });
        },
        [auth, updateActiveTab]
    );

    if (!auth) return null;

    return (
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">
                    {t("auth_editor.type_label")}
                </Label>
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
                        <SelectItem value="none">
                            {t("auth_editor.no_auth")}
                        </SelectItem>
                        <SelectItem value="bearer">
                            {t("auth_editor.bearer_token")}
                        </SelectItem>
                        <SelectItem value="apiKey">
                            {t("auth_editor.api_key")}
                        </SelectItem>
                        <SelectItem value="basic">
                            {t("auth_editor.basic_auth")}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {auth.type === "bearer" && (
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bearer-token" className="text-right">
                        {t("auth_editor.token_label")}
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
                            {t("auth_editor.username_label")}
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
                            {t("auth_editor.password_label")}
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
                            {t("auth_editor.key_label")}
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
                            {t("auth_editor.value_label")}
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
                        <Label className="text-right">
                            {t("auth_editor.add_to_label")}
                        </Label>
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
                                <SelectItem value="header">
                                    {t("auth_editor.header_option")}
                                </SelectItem>
                                <SelectItem value="query">
                                    {t("auth_editor.query_params_option")}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );
}

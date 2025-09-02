"use client";

import { useEffect, useState, useCallback } from "react";
import { useEnvironmentsStore } from "@/store/environments";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectSeparator,
} from "@/components/ui/select";
import { Button } from "./ui/button";
import { Settings, PlusCircle, Trash2, LogIn } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "./ui/input";
import { KeyValueEditor, KeyValuePair } from "./key-value-editor";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "./ui/skeleton";
import debounce from "lodash.debounce";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface EnvironmentManagerProps {
    user: User | null;
}

export function EnvironmentManager({ user }: EnvironmentManagerProps) {
    const {
        environments,
        activeEnvironment,
        fetchEnvironments,
        setActiveEnvironment,
        loading,
        createEnvironment,
        updateEnvironment,
        deleteEnvironment,
    } = useEnvironmentsStore();

    const { t } = useTranslation();

    const [isManageOpen, setIsManageOpen] = useState(false);
    const [selectedEnvForEditing, setSelectedEnvForEditing] = useState<
        string | null
    >(null);
    const [newEnvName, setNewEnvName] = useState("");

    // Хранит "рабочую копию" переменных для редактирования, чтобы не дергать глобальный стор на каждое нажатие.
    const [localVariables, setLocalVariables] = useState<KeyValuePair[]>([]);

    const editableEnv = environments.find(
        (e) => e.id === selectedEnvForEditing
    );

    useEffect(() => {
        // Запускаем fetchEnvironments при монтировании и при изменении состояния пользователя.
        // Стор сам обработает случай, когда user === null и очистит данные.
        fetchEnvironments();
    }, [fetchEnvironments, user]);

    // Эффект для синхронизации локального состояния (localVariables) с глобальным (editableEnv),
    // когда пользователь выбирает другое окружение для редактирования.
    useEffect(() => {
        const pairs = editableEnv?.variables
            ? Object.entries(
                  editableEnv.variables as Record<string, string>
              ).map(([key, value]) => ({ id: crypto.randomUUID(), key, value }))
            : [];
        pairs.push({ id: crypto.randomUUID(), key: "", value: "" });
        setLocalVariables(pairs);
    }, [editableEnv]);

    const handleCreate = () => {
        if (newEnvName.trim()) {
            createEnvironment(newEnvName.trim());
            setNewEnvName("");
        }
    };

    // Создаем debounced-версию функции обновления, которая будет вызываться не чаще, чем раз в 3 секунды
    const debouncedSave = useCallback(
        debounce((envId: string, vars: KeyValuePair[]) => {
            const variablesObj = vars.reduce((acc, pair) => {
                if (pair.key.trim()) {
                    acc[pair.key.trim()] = pair.value;
                }
                return acc;
            }, {} as Record<string, string>);
            updateEnvironment(envId, variablesObj);
        }, 3000),
        []
    );

    const handleVariablesChange = (newPairs: KeyValuePair[]) => {
        // 1. Обновляем локальное состояние МГНОВЕННО, чтобы UI был отзывчивым.
        setLocalVariables(newPairs);

        // 2. Вызываем "ленивое" сохранение в базу данных.
        if (editableEnv) {
            debouncedSave(editableEnv.id, newPairs);
        }
    };

    // Сбрасываем выбранное для редактирования окружение при закрытии диалога
    useEffect(() => {
        if (!isManageOpen) {
            setSelectedEnvForEditing(null);
        }
    }, [isManageOpen]);

    if (loading && user) {
        return <Skeleton className="h-10 w-[220px]" />;
    }

    return (
        <div className="flex items-center gap-2">
            <Select
                value={activeEnvironment?.id || "none"}
                onValueChange={(id) =>
                    setActiveEnvironment(id === "none" ? null : id)
                }
                disabled={!user || loading}
            >
                <SelectTrigger className="w-[180px]">
                    <SelectValue
                        placeholder={t("environments.no_environment")}
                    />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">
                        {t("environments.no_environment")}
                    </SelectItem>
                    {user && environments.length > 0 && <SelectSeparator />}
                    {user &&
                        environments.map((env) => (
                            <SelectItem key={env.id} value={env.id}>
                                {env.name}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>

            <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {t("environments.manage_title")}
                        </DialogTitle>
                        <DialogDescription>
                            {t("environments.manage_description")}
                        </DialogDescription>
                    </DialogHeader>

                    {user ? (
                        <div className="flex-grow grid grid-cols-3 gap-4 overflow-hidden">
                            {/* Левая панель: список окружений */}
                            <div className="col-span-1 border-r pr-4 flex flex-col">
                                <div className="flex gap-2 mb-2 p-1">
                                    <Input
                                        value={newEnvName}
                                        onChange={(e) =>
                                            setNewEnvName(e.target.value)
                                        }
                                        placeholder={t(
                                            "environments.new_placeholder"
                                        )}
                                        className="h-9"
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handleCreate}
                                        className="flex-shrink-0"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex-grow overflow-y-auto">
                                    {environments.map((env) => (
                                        <div
                                            key={env.id}
                                            className={cn(
                                                "flex items-center justify-between p-2 rounded-md hover:bg-muted group",
                                                selectedEnvForEditing ===
                                                    env.id && "bg-accent"
                                            )}
                                        >
                                            <button
                                                className="flex-grow text-left truncate"
                                                onClick={() =>
                                                    setSelectedEnvForEditing(
                                                        env.id
                                                    )
                                                }
                                            >
                                                {env.name}
                                            </button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            {t(
                                                                "environments.delete_title",
                                                                {
                                                                    name: env.name,
                                                                }
                                                            )}
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            {t(
                                                                "environments.delete_description"
                                                            )}
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            {t("common.cancel")}
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() =>
                                                                deleteEnvironment(
                                                                    env.id
                                                                )
                                                            }
                                                        >
                                                            {t("common.delete")}
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Правая панель: редактор переменных */}
                            <div className="col-span-2 overflow-y-auto">
                                {editableEnv ? (
                                    <KeyValueEditor
                                        pairs={localVariables}
                                        onPairsChange={handleVariablesChange}
                                        placeholderKey={t(
                                            "environments.variable_name_placeholder"
                                        )}
                                        placeholderValue={t(
                                            "environments.variable_value_placeholder"
                                        )}
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        {t("environments.select_to_edit")}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center">
                            <LogIn className="h-12 w-12 mx-auto text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">
                                {t("environments.login_prompt_title")}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {t("environments.login_prompt_description")}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

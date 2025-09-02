"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
    PlusCircle,
    Folder,
    FileText,
    Trash2,
    FolderPlus,
    FilePenLine,
} from "lucide-react";
import { useCollectionsStore, SavedRequest } from "@/store/collections";
import { useTabsStore } from "@/store/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CollectionsSkeleton } from "./collections-skeleton";
import { motion } from "framer-motion";
import { DialogDescription } from "@/components/ui/dialog";
import { KeyValuePair } from "./key-value-editor";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { EditableText } from "./editable-text";

export function CollectionsSidebar() {
    const {
        collections,
        loading,
        fetchCollections,
        createCollection,
        deleteCollection,
        deleteRequest,
        updateCollection,
        updateRequest,
    } = useCollectionsStore();
    const addTab = useTabsStore((state) => state.addTab);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<User | null>(null);
    const [editingRequestId, setEditingRequestId] = useState<string | null>(
        null
    );

    const { t } = useTranslation();
    const { toast } = useToast();

    useEffect(() => {
        const supabase = createClient();

        const getUserAndSetupListener = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
            fetchCollections(); // Загружаем коллекции для текущего (возможно, null) пользователя

            const { data: authListener } = supabase.auth.onAuthStateChange(
                (event, session) => {
                    const newUser = session?.user ?? null;
                    setUser(newUser);
                    fetchCollections(); // Перезагружаем коллекции при смене пользователя
                }
            );

            return () => {
                authListener.subscription.unsubscribe();
            };
        };

        const unsubscribePromise = getUserAndSetupListener();

        // Отписка при размонтировании
        return () => {
            unsubscribePromise.then((unsubscribe) => unsubscribe());
        };
    }, [fetchCollections]);

    useEffect(() => {
        // Устанавливаем тайм-аут, чтобы фокус сработал ПОСЛЕ того,
        // как анимация открытия диалога завершится.
        if (dialogOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100); // 100мс обычно достаточно
        }
    }, [dialogOpen]);

    const handleCreateCollection = async () => {
        if (newCollectionName.trim()) {
            const name = newCollectionName.trim(); // Сохраняем имя в переменную
            await createCollection(name);

            toast({
                title: t("toasts.collection_created_title"),
                // Передаем переменную `name` в перевод
                description: t("toasts.collection_created_description", {
                    name: name,
                }),
            });

            setNewCollectionName("");
            setDialogOpen(false);
        }
    };

    const handleRequestClick = (request: SavedRequest) => {
        // Функция для безопасного преобразования данных из Supabase в KeyValuePair[]
        const parseJsonToKvArray = (json: unknown): KeyValuePair[] => {
            if (Array.isArray(json)) {
                // Проверяем, что это массив нужных нам объектов
                return json.map((item) => ({
                    id: item.id || crypto.randomUUID(),
                    key: item.key || "",
                    value: item.value || "",
                }));
            }
            // Если это не массив, возвращаем пустую строку по умолчанию
            return [{ id: crypto.randomUUID(), key: "", value: "" }];
        };

        addTab({
            name: request.name || "Saved Request",
            method: request.method || "GET",
            url: request.url || "",
            body: request.body ? JSON.stringify(request.body, null, 2) : "",
            headers: parseJsonToKvArray(request.headers),
            queryParams: parseJsonToKvArray(request.queryParams),
            isDirty: false,
        });
    };

    return (
        <div className="p-4 h-full flex flex-col border-r">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                    {t("collections.title")}
                </h2>
                {user && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <PlusCircle className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent
                            className="sm:max-w-[425px]"
                            onOpenAutoFocus={(e) => e.preventDefault()}
                        >
                            <DialogHeader>
                                <DialogTitle>
                                    {t("collections.create_dialog_title")}
                                </DialogTitle>
                                <DialogDescription>
                                    {t("collections.create_dialog_description")}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label
                                        htmlFor="new-collection-name"
                                        className="text-right"
                                    >
                                        {t("collections.name_label")}
                                    </Label>
                                    <Input
                                        ref={inputRef}
                                        id="new-collection-name"
                                        value={newCollectionName}
                                        onChange={(e) =>
                                            setNewCollectionName(e.target.value)
                                        }
                                        className="col-span-3"
                                        autoComplete="off"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    onClick={handleCreateCollection}
                                >
                                    {t("collections.create_button")}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
            <div className="flex-grow border-t pt-4 overflow-y-auto">
                {user ? (
                    loading ? (
                        <CollectionsSkeleton />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {collections.length === 0 ? (
                                <div className="text-center py-8">
                                    <FolderPlus className="h-10 w-10 mx-auto text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold">
                                        {t("collections.empty_title")}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t("collections.empty_description")}
                                    </p>
                                </div>
                            ) : (
                                <Accordion type="multiple" className="w-full">
                                    {collections.map((collection) => (
                                        <AccordionItem
                                            key={collection.id}
                                            value={collection.id}
                                        >
                                            <div className="flex items-center group pr-2 rounded-md hover:bg-muted justify-between">
                                                <AccordionTrigger className="px-2 py-0 hover:no-underline text-left justify-start">
                                                    <div className="flex items-center gap-2">
                                                        <Folder className="h-4 w-4" />
                                                        <EditableText
                                                            initialValue={
                                                                collection.name ||
                                                                ""
                                                            }
                                                            onSave={(newName) =>
                                                                updateCollection(
                                                                    collection.id,
                                                                    {
                                                                        name: newName,
                                                                    }
                                                                )
                                                            }
                                                            className="truncate"
                                                            inputClassName="h-6 text-sm bg-transparent"
                                                        />
                                                    </div>
                                                </AccordionTrigger>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
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
                                                                        name: collection.name,
                                                                    }
                                                                )}{" "}
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t(
                                                                    "collections.delete_request_description"
                                                                )}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                {t(
                                                                    "common.cancel"
                                                                )}
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={async (
                                                                    e
                                                                ) => {
                                                                    e.preventDefault();
                                                                    await deleteCollection(
                                                                        collection.id
                                                                    );
                                                                    toast({
                                                                        title: t(
                                                                            "toasts.collection_deleted_title"
                                                                        ),
                                                                        description:
                                                                            t(
                                                                                "toasts.collection_deleted_description",
                                                                                {
                                                                                    name: collection.name,
                                                                                }
                                                                            ),
                                                                    });
                                                                }}
                                                            >
                                                                {t(
                                                                    "common.delete"
                                                                )}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>

                                            <AccordionContent>
                                                {collection.requests.length >
                                                0 ? (
                                                    collection.requests.map(
                                                        (req) => {
                                                            const isEditing =
                                                                editingRequestId ===
                                                                req.id;
                                                            return (
                                                                <div
                                                                    key={req.id}
                                                                    className="flex items-center gap-1 pr-2 rounded-md hover:bg-muted group"
                                                                >
                                                                    <div
                                                                        onClick={() => {
                                                                            if (
                                                                                !isEditing
                                                                            )
                                                                                handleRequestClick(
                                                                                    req
                                                                                );
                                                                        }}
                                                                        className="flex items-center gap-2 p-2 cursor-pointer flex-grow"
                                                                    >
                                                                        <FileText className="h-4 w-4" />
                                                                        {isEditing ? (
                                                                            <Input
                                                                                defaultValue={
                                                                                    req.name ||
                                                                                    ""
                                                                                }
                                                                                onBlur={(
                                                                                    e
                                                                                ) => {
                                                                                    const newName =
                                                                                        e.target.value.trim();
                                                                                    if (
                                                                                        newName &&
                                                                                        newName !==
                                                                                            req.name
                                                                                    ) {
                                                                                        updateRequest(
                                                                                            req.id,
                                                                                            {
                                                                                                name: newName,
                                                                                            }
                                                                                        );
                                                                                    }
                                                                                    setEditingRequestId(
                                                                                        null
                                                                                    );
                                                                                }}
                                                                                onKeyDown={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        e.key ===
                                                                                            "Enter" ||
                                                                                        e.key ===
                                                                                            "Escape"
                                                                                    ) {
                                                                                        e.currentTarget.blur();
                                                                                    }
                                                                                }}
                                                                                autoFocus
                                                                                onFocus={(
                                                                                    e
                                                                                ) =>
                                                                                    e.target.select()
                                                                                }
                                                                                className="h-6 text-sm bg-background"
                                                                                onClick={(
                                                                                    e
                                                                                ) =>
                                                                                    e.stopPropagation()
                                                                                }
                                                                            />
                                                                        ) : (
                                                                            <span className="text-sm truncate">
                                                                                {
                                                                                    req.name
                                                                                }
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                                        onClick={() =>
                                                                            setEditingRequestId(
                                                                                req.id
                                                                            )
                                                                        }
                                                                    >
                                                                        <FilePenLine className="h-4 w-4" />
                                                                    </Button>
                                                                    <AlertDialog>
                                                                        <AlertDialogTrigger
                                                                            asChild
                                                                        >
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                                            >
                                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                                            </Button>
                                                                        </AlertDialogTrigger>
                                                                        <AlertDialogContent>
                                                                            <AlertDialogHeader>
                                                                                <AlertDialogTitle>
                                                                                    {t(
                                                                                        "collections.delete_collection_title",
                                                                                        {
                                                                                            name: req.name,
                                                                                        }
                                                                                    )}
                                                                                </AlertDialogTitle>
                                                                                <AlertDialogDescription>
                                                                                    {t(
                                                                                        "collections.delete_request_description"
                                                                                    )}
                                                                                </AlertDialogDescription>
                                                                            </AlertDialogHeader>
                                                                            <AlertDialogFooter>
                                                                                <AlertDialogCancel>
                                                                                    {t(
                                                                                        "common.cancel"
                                                                                    )}
                                                                                </AlertDialogCancel>
                                                                                <AlertDialogAction
                                                                                    onClick={async (
                                                                                        e
                                                                                    ) => {
                                                                                        e.preventDefault();
                                                                                        await deleteRequest(
                                                                                            req.id
                                                                                        );
                                                                                        toast(
                                                                                            {
                                                                                                title: t(
                                                                                                    "toasts.request_deleted_title"
                                                                                                ),
                                                                                                description:
                                                                                                    t(
                                                                                                        "toasts.request_deleted_description",
                                                                                                        {
                                                                                                            name: req.name,
                                                                                                        }
                                                                                                    ),
                                                                                            }
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    {t(
                                                                                        "common.delete"
                                                                                    )}
                                                                                </AlertDialogAction>
                                                                            </AlertDialogFooter>
                                                                        </AlertDialogContent>
                                                                    </AlertDialog>
                                                                </div>
                                                            );
                                                        }
                                                    )
                                                ) : (
                                                    <p className="text-xs text-muted-foreground p-2">
                                                        {t(
                                                            "collections.empty_collection"
                                                        )}
                                                    </p>
                                                )}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            )}
                        </motion.div>
                    )
                ) : (
                    <div className="text-center py-8">
                        <FolderPlus className="h-10 w-10 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-semibold">
                            {t("collections.login_prompt_title")}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("collections.login_prompt_description")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

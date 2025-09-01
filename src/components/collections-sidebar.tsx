"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { PlusCircle, Folder, FileText, Trash2, FolderPlus } from "lucide-react";
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

export function CollectionsSidebar() {
    const {
        collections,
        loading,
        fetchCollections,
        createCollection,
        deleteCollection,
        deleteRequest,
    } = useCollectionsStore();
    const addTab = useTabsStore((state) => state.addTab);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Загружаем коллекции при первой загрузке компонента
        fetchCollections();
    }, [fetchCollections]);

    useEffect(() => {
        // Устанавливаем тайм-аут, чтобы фокус сработал ПОСЛЕ того,
        // как анимация открытия диалога завершится.
        if (dialogOpen) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100); // 100мс обычно достаточно
        }
    }, [dialogOpen]); // <-- Зависимость от состояния `dialogOpen`

    const handleCreateCollection = async () => {
        if (newCollectionName.trim()) {
            await createCollection(newCollectionName.trim());
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
                <h2 className="text-lg font-semibold">Collections</h2>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent
                        className="sm:max-w-[425px]"
                        // Умный трюк для авто-фокуса
                        onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                        <DialogHeader>
                            <DialogTitle>Create New Collection</DialogTitle>
                            <DialogDescription>
                                Enter a name for your new collection to organize
                                your requests.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    ref={inputRef} // <-- Привязываем ref
                                    id="name"
                                    value={newCollectionName}
                                    onChange={(e) =>
                                        setNewCollectionName(e.target.value)
                                    }
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="submit"
                                onClick={handleCreateCollection}
                            >
                                Create
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex-grow border-t pt-4 overflow-y-auto">
                {loading ? (
                    <CollectionsSkeleton />
                ) : collections.length === 0 ? (
                    <div className="text-center py-8">
                        <FolderPlus className="h-10 w-10 mx-auto text-muted-foreground" />
                        <h3 className="mt-2 text-sm font-semibold">
                            No Collections
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Get started by creating a new collection.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Accordion type="multiple" className="w-full">
                            {collections.map((collection) => (
                                <AccordionItem
                                    key={collection.id}
                                    value={collection.id}
                                >
                                    {/* Оборачиваем триггер и кнопку удаления в div, чтобы они были соседями, а не потомками */}
                                    <div className="flex items-center group pr-2 rounded-md hover:bg-muted justify-between">
                                        <AccordionTrigger className="px-2 py-0 hover:no-underline">
                                            <div className="flex items-center gap-2">
                                                <Folder className="h-4 w-4" />
                                                <span className="truncate">
                                                    {collection.name}
                                                </span>
                                            </div>
                                        </AccordionTrigger>

                                        {/* Кнопка удаления коллекции */}
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
                                                        Are you sure?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently
                                                        delete the collection
                                                        &quot;{collection.name}
                                                        &quot; and all requests
                                                        inside it.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                        Cancel
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={async (e) => {
                                                            e.preventDefault();
                                                            await deleteCollection(
                                                                collection.id
                                                            );
                                                        }}
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>

                                    <AccordionContent>
                                        {collection.requests.length > 0 ? (
                                            collection.requests.map((req) => (
                                                <div
                                                    key={req.id}
                                                    className="flex items-center gap-2 pr-2 rounded-md hover:bg-muted group"
                                                >
                                                    <div
                                                        onClick={() =>
                                                            handleRequestClick(
                                                                req
                                                            )
                                                        }
                                                        className="flex items-center gap-2 p-2 cursor-pointer flex-grow"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                        <span className="text-sm truncate">
                                                            {req.name}
                                                        </span>
                                                    </div>
                                                    {/* Кнопка удаления запроса */}
                                                    <AlertDialog>
                                                        <AlertDialogTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                                onClick={(e) =>
                                                                    e.stopPropagation()
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>
                                                                    Are you
                                                                    sure?
                                                                </AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will
                                                                    permanently
                                                                    delete the
                                                                    request
                                                                    &quot;
                                                                    {req.name}
                                                                    &quot;.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={async (
                                                                        e
                                                                    ) => {
                                                                        // Предотвращаем стандартное поведение кнопки, если оно есть
                                                                        e.preventDefault();
                                                                        // Вызываем нашу асинхронную функцию и дожидаемся ее завершения
                                                                        await deleteRequest(
                                                                            req.id
                                                                        );
                                                                    }}
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-muted-foreground p-2">
                                                No requests in this collection.
                                            </p>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

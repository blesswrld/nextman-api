"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlusCircle, Folder, FileText, Trash2 } from "lucide-react";
import {
    useCollectionsStore,
    CollectionWithRequests,
    SavedRequest,
} from "@/store/collections";
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

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleCreateCollection = async () => {
        if (newCollectionName.trim()) {
            await createCollection(newCollectionName.trim());
            setNewCollectionName("");
            setDialogOpen(false);
        }
    };

    const handleRequestClick = (request: SavedRequest) => {
        addTab({
            name: request.name || "Saved Request",
            method: request.method || "GET",
            url: request.url || "",
            body: request.body ? JSON.stringify(request.body, null, 2) : "",
            headers: Array.isArray(request.headers)
                ? // @ts-ignore
                  (request.headers as any)
                : [],
            queryParams: Array.isArray(request.queryParams)
                ? // @ts-ignore
                  (request.queryParams as any)
                : [],
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
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Create New Collection</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
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
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : collections.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No collections yet. Create one!
                    </p>
                ) : (
                    <Accordion type="multiple" className="w-full">
                        {collections.map((collection) => (
                            <AccordionItem
                                key={collection.id}
                                value={collection.id}
                            >
                                <AccordionTrigger className="hover:bg-muted rounded-md px-2 group">
                                    <div className="flex items-center gap-2 flex-grow">
                                        <Folder className="h-4 w-4" />
                                        <span className="truncate">
                                            {collection.name}
                                        </span>
                                    </div>
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
                                                    This will permanently delete
                                                    the collection &quot
                                                    {collection.name}&quot and
                                                    all requests inside it.
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
                                </AccordionTrigger>
                                <AccordionContent>
                                    {collection.requests.length > 0 ? (
                                        collection.requests.map((req) => (
                                            <div
                                                key={req.id}
                                                className="flex items-center gap-2 pr-2 rounded-md hover:bg-muted group"
                                            >
                                                <div
                                                    onClick={() =>
                                                        handleRequestClick(req)
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
                                                    <AlertDialogTrigger asChild>
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
                                                                Are you sure?
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will
                                                                permanently
                                                                delete the
                                                                request &quot
                                                                {req.name}&quot.
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
                )}
            </div>
        </div>
    );
}

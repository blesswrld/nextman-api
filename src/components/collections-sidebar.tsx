"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { PlusCircle, Folder, FileText } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CollectionsSidebar() {
    const { collections, loading, fetchCollections, createCollection } =
        useCollectionsStore();
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
            body: JSON.stringify(request.body, null, 2) || "",
            // Преобразование jsonb в KeyValuePair[]
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
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <Folder className="h-4 w-4" />
                                        <span>{collection.name}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {collection.requests.length > 0 ? (
                                        collection.requests.map((req) => (
                                            <div
                                                key={req.id}
                                                onClick={() =>
                                                    handleRequestClick(req)
                                                }
                                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                                            >
                                                <FileText className="h-4 w-4" />
                                                <span className="text-sm">
                                                    {req.name}
                                                </span>
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

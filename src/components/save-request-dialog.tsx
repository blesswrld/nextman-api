"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useCollectionsStore } from "@/store/collections";
import { useTabsStore } from "@/store/tabs";
import { KeyValuePair } from "./key-value-editor";

export function SaveRequestDialog() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [requestName, setRequestName] = useState("");
    const [selectedCollection, setSelectedCollection] = useState<string | null>(
        null
    );

    const { collections, saveRequest } = useCollectionsStore();
    const activeTab = useTabsStore((state) =>
        state.tabs.find((t) => t.id === state.activeTabId)
    );

    // Функция для сохранения запроса
    const handleSave = async () => {
        if (!activeTab || !requestName.trim() || !selectedCollection) {
            alert("Please provide a request name and select a collection.");
            return;
        }

        let parsedBody = null;
        try {
            if (activeTab.body.trim()) {
                parsedBody = JSON.parse(activeTab.body);
            }
        } catch (error) {
            alert("Cannot save request: Body contains invalid JSON.");
            return;
        }

        const requestToSave = {
            name: requestName.trim(),
            method: activeTab.method,
            url: activeTab.url,
            body: parsedBody,
            // Фильтруем пустые пары, чтобы не сохранять их в БД
            headers: activeTab.headers.filter((h) => h.key.trim()),
            queryParams: activeTab.queryParams.filter((p) => p.key.trim()),
        };

        // @ts-ignore
        await saveRequest(selectedCollection, requestToSave);
        setDialogOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (open && activeTab) {
            // Предзаполняем имя запроса именем вкладки
            setRequestName(
                activeTab.name !== "Untitled Request" ? activeTab.name : ""
            );
        }
        setDialogOpen(open);
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">Save</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Request</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={requestName}
                            onChange={(e) => setRequestName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="collection" className="text-right">
                            Collection
                        </Label>
                        <Select onValueChange={setSelectedCollection}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a collection" />
                            </SelectTrigger>
                            <SelectContent>
                                {collections.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

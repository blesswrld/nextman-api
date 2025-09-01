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
import { DialogDescription } from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

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

    const { t } = useTranslation();

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
                <Button variant="outline">{t("main.save_button")}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("save_dialog.title")}</DialogTitle>
                    <DialogDescription>
                        {t("save_dialog.description")}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            {t("save_dialog.name_label")}
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
                            {t("save_dialog.collection_label")}
                        </Label>
                        <Select onValueChange={setSelectedCollection}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue
                                    placeholder={t(
                                        "save_dialog.select_collection_placeholder"
                                    )}
                                />
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
                        {t("save_dialog.save_button")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

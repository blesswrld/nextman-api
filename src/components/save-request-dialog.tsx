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
import { useToast } from "@/hooks/use-toast";

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
    const { toast } = useToast();

    // Функция для сохранения запроса
    const handleSave = async () => {
        const finalRequestName = requestName.trim();

        if (!activeTab || !finalRequestName || !selectedCollection) {
            toast({
                title: t("toasts.validation_error_title"),
                description: t("toasts.validation_error_description"),
                variant: "destructive",
            });
            return;
        }

        let parsedBody = null;
        try {
            if (activeTab.body.trim()) {
                parsedBody = JSON.parse(activeTab.body);
            }
        } catch (error) {
            toast({
                title: t("toasts.invalid_json_title"),
                description: t("toasts.invalid_json_description"),
                variant: "destructive",
            });

            return;
        }

        const requestToSave = {
            name: finalRequestName,
            method: activeTab.method,
            url: activeTab.url,
            body: parsedBody,
            // Фильтруем пустые пары, чтобы не сохранять их в БД
            headers: activeTab.headers.filter((h) => h.key.trim()),
            queryParams: activeTab.queryParams.filter((p) => p.key.trim()),
        };

        // @ts-ignore
        await saveRequest(selectedCollection, requestToSave);

        toast({
            title: t("toasts.request_saved_title"),
            description: t("toasts.request_saved_description", {
                name: finalRequestName,
            }),
        });

        setDialogOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (open && activeTab) {
            // Предзаполняем имя запроса именем вкладки, если оно не стандартное
            const initialName =
                activeTab.name === "tabs.untitled_request"
                    ? ""
                    : activeTab.name;
            setRequestName(initialName);
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
                        <Label htmlFor="request-name" className="text-right">
                            {t("save_dialog.name_label")}
                        </Label>
                        <Input
                            id="request-name"
                            value={requestName}
                            onChange={(e) => setRequestName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label
                            htmlFor="collection-select"
                            className="text-right"
                        >
                            {t("save_dialog.collection_label")}
                        </Label>
                        {collections.length > 0 ? (
                            <Select onValueChange={setSelectedCollection}>
                                <SelectTrigger
                                    id="collection-select"
                                    className="col-span-3"
                                >
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
                        ) : (
                            <div className="col-span-3 text-sm text-muted-foreground p-2">
                                {t("save_dialog.create_collection_first")}
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={handleSave}
                        disabled={collections.length === 0}
                    >
                        {t("save_dialog.save_button")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

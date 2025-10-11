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
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const MAX_REQUESTS_PER_COLLECTION = 100;

export function SaveRequestDialog() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [requestName, setRequestName] = useState("");
    const [selectedCollection, setSelectedCollection] = useState<string | null>(
        null
    );

    const { collections, saveRequest } = useCollectionsStore();
    const updateActiveTab = useTabsStore((state) => state.updateActiveTab);

    const activeTab = useTabsStore((state) =>
        state.tabs.find((t) => t.id === state.activeTabId)
    );

    const { t } = useTranslation();
    const { toast } = useToast();

    const selectedCollectionData = collections.find(
        (c) => c.id === selectedCollection
    );
    const isCollectionFull = selectedCollectionData
        ? selectedCollectionData.requests.length >= MAX_REQUESTS_PER_COLLECTION
        : false;

    const handleSave = async () => {
        if (!activeTab) return;

        const finalRequestName = requestName.trim();

        if (isCollectionFull) {
            toast({
                title: t("toasts.collection_full_title"),
                description: t("toasts.collection_full_description", {
                    max: MAX_REQUESTS_PER_COLLECTION,
                }),
                variant: "destructive",
            });
            return;
        }

        if (!finalRequestName || !selectedCollection) {
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
            headers: activeTab.headers.filter((h) => h.key.trim()),
            queryParams: activeTab.queryParams.filter((p) => p.key.trim()),
        };

        // @ts-ignore
        await saveRequest(selectedCollection, requestToSave);

        updateActiveTab({ isDirty: false, name: finalRequestName });

        toast({
            title: t("toasts.request_saved_title"),
            description: t("toasts.request_saved_description", {
                name: finalRequestName,
            }),
        });

        setDialogOpen(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedCollection(null);
        }

        if (open && activeTab) {
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
                            autoComplete="off"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label
                            htmlFor="collection-select"
                            className="text-right pt-2"
                        >
                            {t("save_dialog.collection_label")}
                        </Label>
                        <div className="col-span-3">
                            {collections.length > 0 ? (
                                <Select
                                    onValueChange={setSelectedCollection}
                                    value={selectedCollection || ""}
                                >
                                    <SelectTrigger id="collection-select">
                                        <SelectValue
                                            placeholder={t(
                                                "save_dialog.select_collection_placeholder"
                                            )}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} ({c.requests.length}/
                                                {MAX_REQUESTS_PER_COLLECTION})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="text-sm text-muted-foreground p-2">
                                    {t("save_dialog.create_collection_first")}
                                </div>
                            )}
                            {isCollectionFull && (
                                <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <p>
                                        {t(
                                            "save_dialog.collection_full_warning"
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="submit"
                        onClick={handleSave}
                        disabled={collections.length === 0 || isCollectionFull}
                    >
                        {t("save_dialog.save_button")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

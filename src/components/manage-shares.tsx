"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetDescription,
} from "@/components/ui/sheet";
import { Link as LinkIcon, Trash2, Copy, Check } from "lucide-react";
import { EditableText } from "./editable-text";
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { useTranslation } from "react-i18next";

type SharedRequest = Database["public"]["Tables"]["shared_requests"]["Row"];
const MAX_SHARED_REQUESTS = 20;

export function ManageShares() {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<SharedRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("shared_requests")
            .select("*")
            .order("created_at", { ascending: false });
        if (error)
            toast({
                title: t("toasts.fetch_shares_error_title"),
                description: t("toasts.fetch_shares_error_description"),
                variant: "destructive",
            });
        setRequests(data || []);
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        if (isOpen) {
            fetchRequests();
        }
    }, [isOpen, fetchRequests]);

    const handleCopy = (id: string) => {
        const url = `${window.location.origin}/share/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string, name: string | null) => {
        // 1. ОПТИМИСТИЧНО ОБНОВЛЯЕМ UI
        const previousRequests = requests;
        setRequests((prev) => prev.filter((r) => r.id !== id));

        // 2. ОТПРАВЛЯЕМ ЗАПРОС
        const { error } = await supabase
            .from("shared_requests")
            .delete()
            .eq("id", id);

        // 3. ОБРАБАТЫВАЕМ РЕЗУЛЬТАТ
        if (error) {
            toast({
                title: t("toasts.delete_share_error_title"),
                description: t("toasts.delete_share_error_description"),
                variant: "destructive",
            });
            // Если ошибка, возвращаем UI в предыдущее состояние
            setRequests(previousRequests);
        } else {
            toast({
                title: t("toasts.share_deleted_title"),
                description: t("toasts.share_deleted_description", {
                    name: name || t("manage_shares.untitled_share"),
                }),
            });
        }
    };

    const handleNameUpdate = async (id: string, newName: string) => {
        // 1. ОПТИМИСТИЧНО ОБНОВЛЯЕМ UI
        const previousRequests = requests;
        setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
        );

        // 2. ОТПРАВЛЯЕМ ЗАПРОС
        const { error } = await supabase
            .from("shared_requests")
            // @ts-ignore
            .update({ name: newName })
            .eq("id", id);

        // 3. ОБРАБАТЫВАЕМ РЕЗУЛЬТАТ
        if (error) {
            toast({
                title: t("toasts.update_share_name_error_title"),
                description: t("toasts.update_share_name_error_description"),
                variant: "destructive",
            });
            // Если ошибка, возвращаем UI в предыдущее состояние
            setRequests(previousRequests);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    title={t("manage_shares.button_title")}
                >
                    <LinkIcon className="h-4 w-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>{t("manage_shares.title")}</SheetTitle>
                    <SheetDescription>
                        {t("manage_shares.description", {
                            count: requests.length,
                            max: MAX_SHARED_REQUESTS,
                        })}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto py-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {requests.map((req) => (
                                <div
                                    key={req.id}
                                    className="p-2 border rounded-md flex items-center justify-between group"
                                >
                                    <div className="flex-grow truncate mr-2">
                                        <EditableText
                                            initialValue={
                                                req.name ||
                                                t(
                                                    "manage_shares.untitled_share"
                                                )
                                            }
                                            onSave={(newName) =>
                                                handleNameUpdate(
                                                    req.id,
                                                    newName
                                                )
                                            }
                                            className="text-sm font-medium"
                                            inputClassName="h-7 text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground truncate">
                                            {new Date(
                                                req.created_at
                                            ).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7"
                                            onClick={() => handleCopy(req.id)}
                                        >
                                            {copiedId === req.id ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() =>
                                                handleDelete(req.id, req.name)
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

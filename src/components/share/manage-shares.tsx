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
import { Link as LinkIcon, Trash2, Copy, Check, LogIn } from "lucide-react";
import { EditableText } from "@/components/core/editable-text";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/lib/supabase/database.types";
import { useTranslation } from "react-i18next";
import type { User } from "@supabase/supabase-js";

interface ManageSharesProps {
    user: User | null;
}

type SharedRequest = Database["public"]["Tables"]["shared_requests"]["Row"];
const MAX_SHARED_REQUESTS = 20;

export function ManageShares({ user }: ManageSharesProps) {
    const { t } = useTranslation();
    const [requests, setRequests] = useState<SharedRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { toast } = useToast();
    const supabase = createClient();

    const fetchRequests = useCallback(async () => {
        if (!user) return;
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
    }, [supabase, toast, user]);

    useEffect(() => {
        if (isOpen && user) {
            fetchRequests();
        }
    }, [isOpen, fetchRequests, user]);

    const handleCopy = (id: string) => {
        const url = `${window.location.origin}/share/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDelete = async (id: string, name: string | null) => {
        const previousRequests = requests;
        setRequests((prev) => prev.filter((r) => r.id !== id));

        const { error } = await supabase
            .from("shared_requests")
            .delete()
            .eq("id", id);

        if (error) {
            toast({
                title: t("toasts.delete_share_error_title"),
                description: t("toasts.delete_share_error_description"),
                variant: "destructive",
            });
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
        const previousRequests = requests;
        setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
        );

        const { error } = await supabase
            .from("shared_requests")
            // @ts-ignore
            .update({ name: newName })
            .eq("id", id);

        if (error) {
            toast({
                title: t("toasts.update_share_name_error_title"),
                description: t("toasts.update_share_name_error_description"),
                variant: "destructive",
            });
            setRequests(previousRequests);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <div
                    className="w-full flex justify-between items-center cursor-pointer text-sm"
                    title={t("manage_shares.button_title")}
                >
                    <span>{t("manage_shares.button_title")}</span>
                    <LinkIcon className="h-4 w-4" />
                </div>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>{t("manage_shares.title")}</SheetTitle>
                    {user && (
                        <SheetDescription>
                            {t("manage_shares.description", {
                                count: requests.length,
                                max: MAX_SHARED_REQUESTS,
                            })}
                        </SheetDescription>
                    )}
                </SheetHeader>

                {user ? (
                    <div className="flex-grow overflow-y-auto py-4">
                        {loading ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : requests.length > 0 ? (
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
                                                onClick={() =>
                                                    handleCopy(req.id)
                                                }
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
                                                    handleDelete(
                                                        req.id,
                                                        req.name
                                                    )
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 h-full flex flex-col items-center justify-center">
                                <LinkIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                                <h3 className="mt-4 text-sm font-semibold">
                                    {t("manage_shares.empty_title")}
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {t("manage_shares.empty_description")}
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <LogIn className="h-10 w-10 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-sm font-semibold">
                            {t("manage_shares.login_prompt_title")}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {t("manage_shares.login_prompt_description")}
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

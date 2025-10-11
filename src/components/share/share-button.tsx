"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { useTabsStore } from "@/store/tabs";
import { useToast } from "@/hooks/use-toast";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
const MAX_SHARED_REQUESTS = 20;

interface ShareButtonProps {
    user: User | null;
}

export function ShareButton({ user }: ShareButtonProps) {
    const { t } = useTranslation();

    const { toast } = useToast();
    const activeTab = useTabsStore((state) =>
        state.tabs.find((t) => t.id === state.activeTabId)
    );

    const [loading, setLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState("");
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        if (!activeTab) return;
        setLoading(true);
        setShareUrl("");
        try {
            const supabase = createClient();
            const { count, error: countError } = await supabase
                .from("shared_requests")
                .select("*", { count: "exact", head: true });

            if (countError) throw countError;

            if (count !== null && count >= MAX_SHARED_REQUESTS) {
                toast({
                    title: t("toasts.share_limit_reached_title"),
                    description: t("toasts.share_limit_reached_description", {
                        max: MAX_SHARED_REQUESTS,
                    }),
                    variant: "destructive",
                });
                setLoading(false);
                return;
            }

            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(activeTab),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to share");

            const url = `${window.location.origin}/share/${data.id}`;
            setShareUrl(url);
        } catch (error: any) {
            toast({
                title: t("toasts.share_error_title"),
                description: t("toasts.share_error_description"),
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!user) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" disabled>
                            <Share2 className="h-4 w-4 mr-2" />
                            {t("share_button.share")}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{t("share_button.login_prompt")}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <Popover onOpenChange={(open) => !open && setShareUrl("")}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    disabled={loading}
                >
                    <Share2 className="h-4 w-4 mr-2" />
                    {t("share_button.share")}
                </Button>
            </PopoverTrigger>
            <PopoverContent>
                {loading && !shareUrl ? (
                    <p className="text-sm p-2">
                        {t("share_button.generating")}
                    </p>
                ) : shareUrl ? (
                    <div className="flex gap-2">
                        <Input value={shareUrl} readOnly />
                        <Button size="icon" onClick={handleCopy}>
                            {copied ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                ) : null}
            </PopoverContent>
        </Popover>
    );
}

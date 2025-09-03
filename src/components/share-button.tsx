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
import { Input } from "./ui/input";
import { useTranslation } from "react-i18next";

export function ShareButton() {
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
        try {
            const res = await fetch("/api/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(activeTab), // Отправляем все данные вкладки
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
                {loading ? (
                    <p>{t("share_button.generating")}</p>
                ) : (
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
                )}
            </PopoverContent>
        </Popover>
    );
}

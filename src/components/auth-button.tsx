"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { clearHistory } from "@/lib/history-db";
import { useTranslation } from "react-i18next";

export function AuthButton() {
    const supabase = createClient();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const { t } = useTranslation();

    useEffect(() => {
        const getUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        getUser();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [supabase]);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: location.origin,
            },
        });
    };

    const handleLogout = async () => {
        // Сначала вызываем signOut
        await supabase.auth.signOut();
        // Затем полностью очищаем локальную историю
        await clearHistory();
        // И только потом обновляем локальное состояние UI
        setUser(null);
    };

    if (loading) {
        // Используем скелетон, имитирующий кнопку
        return <Skeleton className="h-10 w-24 rounded-md" />;
    }

    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className="relative h-10 w-10 rounded-full"
                    >
                        <Avatar className="h-10 w-10">
                            <AvatarImage
                                src={user.user_metadata?.avatar_url}
                                alt={user.user_metadata?.name}
                            />
                            <AvatarFallback>
                                {user.user_metadata?.name?.[0] || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">
                                {user.user_metadata?.name}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                        {t("auth.logout_button")}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return <Button onClick={handleLogin}>{t("auth.login_button")}</Button>;
}

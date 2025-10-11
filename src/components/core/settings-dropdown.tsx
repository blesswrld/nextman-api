"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeToggle } from "@/components/core/theme-toggle";
import { CodeGenerationDialog } from "@/components/code-gen/code-generation-dialog";
import { ManageShares } from "@/components/share/manage-shares";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

interface SettingsDropdownProps {
    user: User | null;
}

export function SettingsDropdown({ user }: SettingsDropdownProps) {
    const { t } = useTranslation();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    title={t("common.settings")}
                >
                    <Settings className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <LanguageSwitcher />
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <ThemeToggle />
                    </DropdownMenuItem>

                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <CodeGenerationDialog />
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                {user && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                            >
                                <ManageShares user={user} />
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

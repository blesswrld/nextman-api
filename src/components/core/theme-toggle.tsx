"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme();
    const { t } = useTranslation();

    // Переключаем тему (light -> dark -> system -> light)
    const toggleTheme = () => {
        const currentTheme = theme === "system" ? resolvedTheme : theme;
        if (currentTheme === "dark") {
            setTheme("light");
        } else {
            setTheme("dark");
        }
    };

    return (
        <div
            className="w-full flex justify-between items-center cursor-pointer text-sm"
            onClick={toggleTheme}
        >
            <span className="text-">{t("theme_switcher.toggle_theme")}</span>
            <div className="text-muted-foreground">
                {/* Показываем правильную иконку в зависимости от темы */}
                {resolvedTheme === "dark" ? (
                    <Moon className="h-4 w-4" />
                ) : (
                    <Sun className="h-4 w-4" />
                )}
            </div>
        </div>
    );
}

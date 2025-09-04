"use client";

import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react"; // Импортируем иконку

export function LanguageSwitcher() {
    const { t, i18n } = useTranslation();

    // Переключаем язык по кругу (RU -> EN -> RU)
    const toggleLanguage = () => {
        const nextLang = i18n.language === "ru" ? "en" : "ru";
        i18n.changeLanguage(nextLang);
        localStorage.setItem("i18nextLng", nextLang);
    };

    return (
        // Теперь это единый, кликабельный элемент
        <div
            className="w-full flex justify-between items-center cursor-pointer text-sm"
            onClick={toggleLanguage}
        >
            <span>{t("language_switcher.button_title")}</span>
            <div className="flex items-center gap-1 text-muted-foreground">
                <span>{i18n.language.toUpperCase()}</span>
                <Languages className="h-4 w-4" />
            </div>
        </div>
    );
}

"use client";

import { I18nextProvider } from "react-i18next";
import i18n from "@/../i18n";
import { useEffect } from "react";

export function I18nProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const savedLang = localStorage.getItem("i18nextLng");
        if (savedLang) {
            i18n.changeLanguage(savedLang);
        }
    }, []);

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

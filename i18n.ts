import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enTranslation from "./public/locales/en/translation.json";
import ruTranslation from "./public/locales/ru/translation.json";

i18n.use(initReactI18next).init({
    resources: {
        en: {
            translation: enTranslation,
        },
        ru: {
            translation: ruTranslation,
        },
    },
    lng: "en", // язык по умолчанию
    fallbackLng: "en", // язык, который будет использоваться, если перевод не найден
    interpolation: {
        escapeValue: false,
    },
});

export default i18n;

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { ThemeProvider } from "@/components/core/theme-provider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: "Nextman API, A modern web-based API client",

    // Добавляем иконки
    icons: {
        // Стандартные иконки для вкладок браузера
        icon: [
            {
                url: "/favicon/favicon-16x16.png",
                sizes: "16x16",
                type: "image/png",
            },
            {
                url: "/favicon/favicon-32x32.png",
                sizes: "32x32",
                type: "image/png",
            },
            {
                url: "/favicon/favicon-96x96.png",
                sizes: "96x96",
                type: "image/png",
            },
            // Добавляем иконки Android, которые также могут использоваться как favicon
            {
                url: "/favicon/android-icon-36x36.png",
                sizes: "36x36",
                type: "image/png",
            },
            {
                url: "/favicon/android-icon-48x48.png",
                sizes: "48x48",
                type: "image/png",
            },
            {
                url: "/favicon/android-icon-72x72.png",
                sizes: "72x72",
                type: "image/png",
            },
            {
                url: "/favicon/android-icon-96x96.png",
                sizes: "96x96",
                type: "image/png",
            },
            {
                url: "/favicon/android-icon-144x144.png",
                sizes: "144x144",
                type: "image/png",
            },
            {
                url: "/favicon/android-icon-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
        ],
        // Иконки для Apple-устройств
        apple: [
            { url: "/favicon/apple-icon-57x57.png", sizes: "57x57" },
            { url: "/favicon/apple-icon-60x60.png", sizes: "60x60" },
            { url: "/favicon/apple-icon-72x72.png", sizes: "72x72" },
            { url: "/favicon/apple-icon-76x76.png", sizes: "76x76" },
            { url: "/favicon/apple-icon-114x114.png", sizes: "114x114" },
            { url: "/favicon/apple-icon-120x120.png", sizes: "120x120" },
            { url: "/favicon/apple-icon-144x144.png", sizes: "144x144" },
            { url: "/favicon/apple-icon-152x152.png", sizes: "152x152" },
            { url: "/favicon/apple-icon-180x180.png", sizes: "180x180" },
        ],
        // Иконка для старых браузеров
        shortcut: ["/favicon/favicon.ico"],
    },

    // Манифест
    manifest: "/favicon/manifest.json",

    // Мета-теги для Windows Tiles
    other: {
        "msapplication-TileColor": "#ffffff",
        // Указываем все размеры для Windows Tiles
        "msapplication-TileImage": "/favicon/ms-icon-144x144.png",
        "msapplication-config": "/favicon/browserconfig.xml", // <-- Добавляем ссылку на browserconfig.xml
    },
};

// --- Viewport ---
export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#ffffff" },
        { media: "(prefers-color-scheme: dark)", color: "#000000" },
    ],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <I18nProvider>
                        <Toaster />
                        {children}
                    </I18nProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}

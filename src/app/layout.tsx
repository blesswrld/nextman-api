import type { Metadata } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/i18n-provider";

export const metadata: Metadata = {
    title: "Nextman API, A modern web-based API client",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <I18nProvider>{children}</I18nProvider>
            </body>
        </html>
    );
}

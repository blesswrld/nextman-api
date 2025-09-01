import type { Metadata } from "next";
import "./globals.css";

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
            <body>{children}</body>
        </html>
    );
}

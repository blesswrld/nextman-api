import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "My API Client",
    description: "A web-based API client",
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

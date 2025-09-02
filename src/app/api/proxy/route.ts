import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { url, method, headers, body } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: "URL is required" },
                { status: 400 }
            );
        }

        // Удаляем заголовки, которые не должны пересылаться
        // Это важно, чтобы избежать ошибок с content-length и т.д.
        const headersToSend = new Headers(headers);
        headersToSend.delete("host");
        headersToSend.delete("content-length");
        headersToSend.delete("connection");
        // Браузеры могут добавлять свои заголовки, которые нам не нужны
        headersToSend.delete("accept-encoding");

        const options: RequestInit = {
            method,
            headers: headersToSend,
            redirect: "follow", // Следовать за редиректами
        };

        // Добавляем тело только для определенных методов
        if (
            body &&
            (method === "POST" || method === "PUT" || method === "PATCH")
        ) {
            options.body = body;
        }

        // Делаем реальный запрос
        const apiResponse = await fetch(url, options);

        // Сначала получаем заголовки ответа, чтобы узнать тип контента
        const responseHeaders: { [key: string]: string } = {};
        apiResponse.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        const contentType = responseHeaders["content-type"] || "";

        let responseBody: any;
        let isBase64 = false; // Флаг, который мы отправим на клиент

        // Проверяем, является ли контент текстовым (JSON, HTML, XML, SVG, и т.д.)
        const isTextContent =
            contentType.includes("application/json") ||
            contentType.includes("text/") ||
            contentType.includes("application/xml") ||
            contentType.includes("application/svg+xml");

        if (isTextContent) {
            // Если это текст, просто читаем его как текст
            responseBody = await apiResponse.text();
        } else {
            // Для всех остальных типов (изображения, pdf, и т.д.) считаем их бинарными
            isBase64 = true;
            // Получаем данные как ArrayBuffer
            const buffer = await apiResponse.arrayBuffer();
            // Кодируем в Base64, чтобы безопасно передать через JSON
            responseBody = Buffer.from(buffer).toString("base64");
        }

        // Отправляем все обратно на наш фронтенд, включая новый флаг isBase64
        return NextResponse.json(
            {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
                body: responseBody,
                isBase64: isBase64,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Proxy error:", error);
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json(
            { error: "An unknown error occurred" },
            { status: 500 }
        );
    }
}

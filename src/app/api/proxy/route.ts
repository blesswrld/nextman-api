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

        // Получаем тело ответа
        const responseBody = await apiResponse.text();

        // Получаем заголовки ответа и преобразуем их в простой объект
        const responseHeaders: { [key: string]: string } = {};
        apiResponse.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // Отправляем все обратно на наш фронтенд
        return NextResponse.json(
            {
                status: apiResponse.status,
                statusText: apiResponse.statusText,
                headers: responseHeaders,
                body: responseBody,
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

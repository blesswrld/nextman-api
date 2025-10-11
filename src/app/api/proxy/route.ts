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

        const headersToSend = new Headers(headers);
        headersToSend.delete("host");
        headersToSend.delete("content-length");
        headersToSend.delete("connection");
        headersToSend.delete("accept-encoding");

        const options: RequestInit = {
            method,
            headers: headersToSend,
            redirect: "follow",
        };

        if (
            body &&
            (method === "POST" || method === "PUT" || method === "PATCH")
        ) {
            options.body = body;
        }

        const apiResponse = await fetch(url, options);

        const responseHeaders: { [key: string]: string } = {};
        apiResponse.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        const contentType = responseHeaders["content-type"] || "";

        let responseBody: any;
        let isBase64 = false;

        const isTextContent =
            contentType.includes("application/json") ||
            contentType.includes("text/") ||
            contentType.includes("application/xml") ||
            contentType.includes("application/svg+xml");

        if (isTextContent) {
            responseBody = await apiResponse.text();
        } else {
            isBase64 = true;
            const buffer = await apiResponse.arrayBuffer();
            responseBody = Buffer.from(buffer).toString("base64");
        }

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

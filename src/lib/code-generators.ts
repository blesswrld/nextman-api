import { KeyValuePair } from "@/components/key-value-editor";

// Тип для входных данных, чтобы генераторы знали, с чем работают
export interface CodeGenInput {
    url: string;
    method: string;
    headers: KeyValuePair[];
    body?: string;
}

// --- Генератор для cURL ---
export function generateCurl(input: CodeGenInput): string {
    let curl = `curl --location --request ${input.method} '${input.url}'`;

    // Добавляем заголовки
    input.headers.forEach((header) => {
        if (header.key) {
            curl += ` \\\n--header '${header.key}: ${header.value}'`;
        }
    });

    // Добавляем тело, если оно есть
    if (input.body && ["POST", "PUT", "PATCH"].includes(input.method)) {
        // Экранируем одинарные кавычки в JSON для безопасности
        const escapedBody = input.body.replace(/'/g, "'\\''");
        curl += ` \\\n--data-raw '${escapedBody}'`;
    }

    return curl;
}

// --- Генератор для JavaScript (Fetch) ---
export function generateFetch(input: CodeGenInput): string {
    let options = `{\n  method: '${input.method}',`;

    // Добавляем заголовки
    if (input.headers.length > 0) {
        options += `\n  headers: {\n`;
        input.headers.forEach((header) => {
            if (header.key) {
                options += `    '${header.key}': '${header.value}',\n`;
            }
        });
        options += `  },`;
    }

    // Добавляем тело
    if (input.body && ["POST", "PUT", "PATCH"].includes(input.method)) {
        options += `\n  body: JSON.stringify(${input.body}),`;
    }

    options += `\n}`;

    return `fetch('${input.url}', ${options})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
}

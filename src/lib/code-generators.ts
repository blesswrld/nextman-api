import { KeyValuePair } from "@/components/core/key-value-editor";

export interface CodeGenInput {
    url: string;
    method: string;
    headers: KeyValuePair[];
    body?: string;
}

export function generateCurl(input: CodeGenInput): string {
    let curl = `curl --location --request ${input.method} '${input.url}'`;

    input.headers.forEach((header) => {
        if (header.key) {
            curl += ` \\\n--header '${header.key}: ${header.value}'`;
        }
    });

    if (input.body && ["POST", "PUT", "PATCH"].includes(input.method)) {
        const escapedBody = input.body.replace(/'/g, "'\\''");
        curl += ` \\\n--data-raw '${escapedBody}'`;
    }

    return curl;
}

export function generateFetch(input: CodeGenInput): string {
    let options = `{\n  method: '${input.method}',`;

    if (input.headers.length > 0) {
        options += `\n  headers: {\n`;
        input.headers.forEach((header) => {
            if (header.key) {
                options += `    '${header.key}': '${header.value}',\n`;
            }
        });
        options += `  },`;
    }

    if (input.body && ["POST", "PUT", "PATCH"].includes(input.method)) {
        options += `\n  body: JSON.stringify(${input.body}),`;
    }

    options += `\n}`;

    return `fetch('${input.url}', ${options})\n  .then(response => response.json())\n  .then(data => console.log(data))\n  .catch(error => console.error('Error:', error));`;
}

export function generateAxios(input: CodeGenInput): string {
    let config = `{\n  method: '${input.method.toLowerCase()}',\n  url: '${
        input.url
    }',`;

    if (input.headers.length > 0) {
        config += `\n  headers: {\n`;
        input.headers.forEach((header) => {
            if (header.key) {
                config += `    '${header.key}': '${header.value}',\n`;
            }
        });
        config += `  },`;
    }

    if (input.body && ["POST", "PUT", "PATCH"].includes(input.method)) {
        config += `\n  data: ${input.body}`;
    }

    config += `\n}`;

    return `import axios from 'axios';\n\nconst config = ${config};\n\naxios.request(config)\n  .then((response) => {\n    console.log(JSON.stringify(response.data));\n  })\n  .catch((error) => {\n    console.log(error);\n  });`;
}

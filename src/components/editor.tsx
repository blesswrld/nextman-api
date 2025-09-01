"use client";

import Editor, { OnChange, OnMount } from "@monaco-editor/react";

interface CodeEditorProps {
    value: string;
    onChange?: OnChange;
    readOnly?: boolean;
    language?: string;
}

export function CodeEditor({
    value,
    onChange,
    readOnly = false,
    language = "json",
}: CodeEditorProps) {
    const handleEditorDidMount: OnMount = (editor, monaco) => {
        // Здесь можно кастомизировать редактор при его монтировании
        // Например, добавить кастомные темы или настройки
        editor.focus();
    };

    return (
        <div className="w-full h-full border rounded-md">
            <Editor
                height="100%"
                language={language}
                value={value}
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    readOnly: readOnly,
                    minimap: { enabled: false }, // отключаем мини-карту
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: "on",
                    automaticLayout: true, // автоматически подстраивается под размер контейнера
                }}
                theme="vs-dark" // Используем темную тему
            />
        </div>
    );
}

"use client";

import Editor, { OnChange, OnMount } from "@monaco-editor/react";
import { useCompletion } from "@/hooks/use-completion";

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
    const { registerCompletionProvider } = useCompletion();

    const handleEditorDidMount: OnMount = (editor, monaco) => {
        const provider = registerCompletionProvider(monaco);

        editor.onDidDispose(() => {
            provider.dispose();
        });

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
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: "on",
                    automaticLayout: true,
                }}
                theme="vs-dark"
            />
        </div>
    );
}

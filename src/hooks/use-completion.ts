import { useEnvironmentsStore } from "@/store/environments";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export function useCompletion() {
    const { activeEnvironment } = useEnvironmentsStore();

    const registerCompletionProvider = (editorInstance: typeof monaco) => {
        return editorInstance.languages.registerCompletionItemProvider("json", {
            triggerCharacters: ["{"],
            provideCompletionItems: (model, position) => {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                });

                // Срабатываем, только если пользователь ввел {{
                if (!textUntilPosition.endsWith("{{")) {
                    return { suggestions: [] };
                }

                const variables =
                    (activeEnvironment?.variables as Record<string, string>) ||
                    {};
                const suggestions = Object.keys(variables).map((key) => ({
                    label: `{{${key}}}`,
                    kind: editorInstance.languages.CompletionItemKind.Variable,
                    insertText: `${key}}}`, // Вставляем только недостающую часть
                    range: new monaco.Range(
                        position.lineNumber,
                        position.column - 2, // Заменяем {{
                        position.lineNumber,
                        position.column
                    ),
                }));

                return { suggestions };
            },
        });
    };

    return { registerCompletionProvider };
}

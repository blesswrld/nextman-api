import { useEffect } from "react";

export const useHotkeys = (hotkeys: [string, (e: KeyboardEvent) => void][]) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            for (const [key, handler] of hotkeys) {
                const keys = key.split("+");
                const ctrl = keys.includes("ctrl");
                const cmd = keys.includes("cmd");
                const keyToPress = keys[keys.length - 1];

                if (
                    // Группируем проверку Ctrl/Cmd в скобки
                    ((ctrl && event.ctrlKey) || (cmd && event.metaKey)) &&
                    event.key.toLowerCase() === keyToPress.toLowerCase()
                ) {
                    event.preventDefault();
                    handler(event);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [hotkeys]);
};

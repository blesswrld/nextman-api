"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export interface KeyValuePair {
    id: string;
    key: string;
    value: string;
}

interface KeyValueEditorProps {
    pairs: KeyValuePair[];
    setPairs: (pairs: KeyValuePair[]) => void;
    placeholderKey?: string;
    placeholderValue?: string;
}

export function KeyValueEditor({
    pairs,
    setPairs,
    placeholderKey = "Key",
    placeholderValue = "Value",
}: KeyValueEditorProps) {
    const handlePairChange = (
        id: string,
        field: "key" | "value",
        newValue: string
    ) => {
        const newPairs = pairs.map((pair) =>
            pair.id === id ? { ...pair, [field]: newValue } : pair
        );
        setPairs(newPairs);

        // Если пользователь начал вводить текст в последней строке, добавляем новую пустую строку
        const lastPair = newPairs[newPairs.length - 1];
        if (lastPair && (lastPair.key || lastPair.value)) {
            setPairs([
                ...newPairs,
                { id: crypto.randomUUID(), key: "", value: "" },
            ]);
        }
    };

    const handleRemovePair = (id: string) => {
        // Не позволяем удалить последнюю строку, если она единственная
        if (pairs.length <= 1) return;

        const newPairs = pairs.filter((pair) => pair.id !== id);
        setPairs(newPairs);
    };

    return (
        <div className="space-y-2">
            {pairs.map((pair) => (
                <div key={pair.id} className="flex items-center gap-2">
                    <Input
                        placeholder={placeholderKey}
                        value={pair.key}
                        onChange={(e) =>
                            handlePairChange(pair.id, "key", e.target.value)
                        }
                        className="font-mono text-sm"
                    />
                    <Input
                        placeholder={placeholderValue}
                        value={pair.value}
                        onChange={(e) =>
                            handlePairChange(pair.id, "value", e.target.value)
                        }
                        className="font-mono text-sm"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePair(pair.id)}
                        disabled={pairs.length <= 1}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}

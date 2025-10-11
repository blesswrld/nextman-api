"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { VariableInput } from "@/components/environment/variable-input";
import { cn } from "@/lib/utils";

export interface KeyValuePair {
    id: string;
    key: string;
    value: string;
}

interface KeyValueEditorProps {
    pairs: KeyValuePair[];
    onPairsChange: (newPairs: KeyValuePair[]) => void;
    placeholderKey?: string;
    placeholderValue?: string;
    disabled?: boolean;
}

export function KeyValueEditor({
    pairs,
    onPairsChange,
    placeholderKey = "Key",
    placeholderValue = "Value",
    disabled = false,
}: KeyValueEditorProps) {
    const handleFieldChange = (
        id: string,
        field: "key" | "value",
        newValue: string
    ) => {
        let newPairs = pairs.map((p) =>
            p.id === id ? { ...p, [field]: newValue } : p
        );

        const lastPair = newPairs[newPairs.length - 1];
        if (lastPair && (lastPair.key.trim() || lastPair.value.trim())) {
            newPairs.push({ id: crypto.randomUUID(), key: "", value: "" });
        }

        onPairsChange(newPairs);
    };

    const handleRemovePair = (idToRemove: string) => {
        const newPairs = pairs.filter((p) => p.id !== idToRemove);

        if (newPairs.length === 0) {
            onPairsChange([{ id: crypto.randomUUID(), key: "", value: "" }]);
        } else {
            onPairsChange(newPairs);
        }
    };

    return (
        <div className="space-y-2">
            {pairs.map((pair, index) => (
                <div key={pair.id} className="flex items-center gap-2 p-1">
                    <VariableInput
                        placeholder={placeholderKey}
                        value={pair.key}
                        onChange={(e) =>
                            handleFieldChange(pair.id, "key", e.target.value)
                        }
                        className={cn(
                            "font-mono text-sm",
                            disabled &&
                                index === pairs.length - 1 &&
                                "focus-visible:ring-0 focus-visible:ring-offset-0"
                        )}
                        disabled={disabled && index === pairs.length - 1}
                    />
                    <VariableInput
                        placeholder={placeholderValue}
                        value={pair.value}
                        onChange={(e) =>
                            handleFieldChange(pair.id, "value", e.target.value)
                        }
                        className={cn(
                            "font-mono text-sm",
                            disabled &&
                                index === pairs.length - 1 &&
                                "focus-visible:ring-0 focus-visible:ring-offset-0"
                        )}
                        disabled={disabled && index === pairs.length - 1}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePair(pair.id)}
                        disabled={
                            index === pairs.length - 1 &&
                            !pair.key.trim() &&
                            !pair.value.trim()
                        }
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
        </div>
    );
}
